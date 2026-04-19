import type { ProgressEvent, BmcAnalysis } from "../types";
import { bmcJsonSchema, type BmcResponse } from "../bmc-schema";
import { SYSTEM_PROMPT, userPrompt, userPromptWithEvidence } from "./prompts";
import { extractText, parseAndRepair, coherenceWarnings } from "./validators";
import { rankSources } from "../sources/ranking";
import { collectEvidence, type Evidence } from "../sources/collector";
import { getAnthropic, MODEL as ANTHROPIC_MODEL, EFFORT, isLiveMode as anthropicEnabled } from "./client";
import {
  openRouterChat,
  openRouterEnabled,
  extractJsonObject,
  OPENROUTER_MODEL
} from "./openrouter";
import { mockBmc } from "./mock";
import { shortId } from "../utils";

export interface RunInput {
  company: string;
  country?: string;
  sector?: string;
  website?: string;
  language?: "fr" | "en" | "ar";
}

type Mode = "openrouter" | "anthropic" | "mock";

function selectMode(): Mode {
  if (openRouterEnabled()) return "openrouter";
  if (anthropicEnabled()) return "anthropic";
  return "mock";
}

/**
 * Full BMC generation pipeline. Emits ProgressEvents as it runs.
 * Flow: select provider → collect real web evidence → call LLM →
 *       validate/repair → compute coherence warnings → done.
 */
export async function runPipeline(
  input: RunInput,
  emit: (ev: ProgressEvent) => void
): Promise<BmcAnalysis> {
  const started = Date.now();
  const emitStep = (
    step: ProgressEvent["step"],
    message: string,
    percent: number,
    detail?: unknown
  ) =>
    emit({
      step,
      message,
      percent,
      at: new Date().toISOString(),
      detail
    });

  const mode = selectMode();
  emitStep("started", `Analyse de « ${input.company} » démarrée (mode: ${mode})`, 2);

  let bmc: BmcResponse;
  let actualMode: "live" | "mock" = mode === "mock" ? "mock" : "live";
  let modelLabel: string = mode === "mock" ? "mock-v1" : mode;

  let evidence: Evidence[] = [];

  // 1. Collect real evidence — only when we have a live provider.
  if (mode !== "mock") {
    try {
      evidence = await collectEvidence(
        input.company,
        {
          country: input.country,
          sector: input.sector,
          website: input.website,
          language: input.language ?? "fr"
        },
        (step, msg, pct) => emitStep(step as any, msg, pct)
      );
    } catch (err: any) {
      emitStep(
        "error",
        `Collecte échouée: ${err?.message ?? err} — on tente la génération sans evidence.`,
        35
      );
    }
    if (!evidence.length) {
      emitStep(
        "collect",
        "Aucune source exploitable collectée. Bascule en mode mock.",
        40
      );
      actualMode = "mock";
    }
  }

  // 2. Generate.
  try {
    if (mode === "openrouter" && actualMode === "live") {
      emitStep("generate", `Génération via OpenRouter (${OPENROUTER_MODEL})…`, 55);
      modelLabel = OPENROUTER_MODEL;
      const raw = await openRouterChat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: userPromptWithEvidence(input.company, evidence, {
              country: input.country,
              sector: input.sector,
              website: input.website,
              language: input.language ?? "fr"
            })
          }
        ],
        { jsonMode: true, maxTokens: 6000, timeoutMs: 120_000 }
      );
      emitStep("validate", "Validation du schéma et cohérence…", 80);
      bmc = parseAndRepair(extractJsonObject(raw));
      // Merge any evidence sources missing from the model output.
      bmc = mergeEvidenceSources(bmc, evidence);
    } else if (mode === "anthropic" && actualMode === "live") {
      const client = getAnthropic()!;
      emitStep("generate", `Génération via ${ANTHROPIC_MODEL} (effort=${EFFORT})…`, 55);
      modelLabel = ANTHROPIC_MODEL;
      const stream = client.messages.stream({
        model: ANTHROPIC_MODEL,
        max_tokens: 8192,
        thinking: { type: "adaptive" } as any,
        output_config: {
          effort: EFFORT,
          format: { type: "json_schema", schema: bmcJsonSchema }
        } as any,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" }
          }
        ] as any,
        messages: [
          {
            role: "user",
            content: evidence.length
              ? userPromptWithEvidence(input.company, evidence, {
                  country: input.country,
                  sector: input.sector,
                  website: input.website,
                  language: input.language ?? "fr"
                })
              : userPrompt(input.company, {
                  country: input.country,
                  sector: input.sector,
                  website: input.website,
                  language: input.language ?? "fr"
                })
          }
        ]
      } as any);

      stream.on("text", (delta) => {
        if (delta.length > 0) emitStep("generate", "Rédaction du canvas…", 65);
      });
      const final = await stream.finalMessage();
      emitStep("validate", "Validation du schéma…", 80);
      bmc = parseAndRepair(extractText(final));
      bmc = mergeEvidenceSources(bmc, evidence);
    } else {
      emitStep(
        "generate",
        "Aucun provider LLM configuré. Génération mock déterministe…",
        55
      );
      await sleep(300);
      bmc = mockBmc(input.company);
      emitStep("validate", "Validation du schéma…", 78);
    }
  } catch (err: any) {
    emitStep(
      "error",
      `Génération LLM échouée (${err?.message ?? err}). Bascule mock.`,
      70
    );
    actualMode = "mock";
    modelLabel = "mock-v1";
    bmc = mockBmc(input.company);
  }

  // 3. Rank sources, coherence warnings.
  bmc.sources = rankSources(bmc.sources as any) as any;
  const warnings = coherenceWarnings(bmc);
  emitStep("analyze", "Synthèse stratégique, SWOT, innovation lens…", 92, {
    warnings
  });

  const analysis: BmcAnalysis = {
    id: shortId(),
    company: bmc.company,
    blocks: bmc.blocks as BmcAnalysis["blocks"],
    sources: bmc.sources as BmcAnalysis["sources"],
    analysis: {
      ...bmc.analysis,
      coherence: {
        ...bmc.analysis.coherence,
        notes: [...bmc.analysis.coherence.notes, ...warnings]
      }
    },
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: modelLabel,
      mode: actualMode,
      durationMs: Date.now() - started,
      version: 1
    }
  };

  emitStep("done", "Analyse terminée", 100);
  return analysis;
}

/** Ensure the returned BMC's root `sources` array contains every evidence source referenced by blocks. */
function mergeEvidenceSources(bmc: BmcResponse, evidence: Evidence[]): BmcResponse {
  const have = new Set((bmc.sources ?? []).map((s) => s.id));
  const merged = [...(bmc.sources ?? [])];
  for (const ev of evidence) {
    if (!have.has(ev.source.id)) {
      merged.push(ev.source);
      have.add(ev.source.id);
    }
  }
  return { ...bmc, sources: merged } as BmcResponse;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
