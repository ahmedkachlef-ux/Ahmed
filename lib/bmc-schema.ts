import { z } from "zod";
import { BLOCK_ORDER } from "./types";

const blockStatus = z.enum(["verified", "estimated", "incomplete"]);

const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().optional(),
  publisher: z.string().optional(),
  date: z.string().optional(),
  rank: z.number().int().min(1).max(7),
  category: z.string()
});

const blockSchema = z.object({
  id: z.enum(BLOCK_ORDER as unknown as [string, ...string[]]),
  items: z.array(z.string().min(1)).min(1),
  justification: z.string().min(1),
  sources: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  status: blockStatus,
  notes: z.string().optional(),
  flags: z.array(z.string()).optional()
});

const blocksShape = Object.fromEntries(
  BLOCK_ORDER.map((id) => [id, blockSchema.extend({ id: z.literal(id) })])
) as Record<string, z.ZodTypeAny>;

export const bmcResponseSchema = z.object({
  company: z.object({
    name: z.string(),
    legalName: z.string().optional(),
    country: z.string().optional(),
    sector: z.string().optional(),
    website: z.string().optional(),
    description: z.string().optional()
  }),
  blocks: z.object(blocksShape),
  sources: z.array(sourceSchema),
  analysis: z.object({
    summary: z.string(),
    swot: z.object({
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      opportunities: z.array(z.string()),
      threats: z.array(z.string())
    }),
    coherence: z.object({
      score: z.number().min(0).max(100),
      notes: z.array(z.string())
    }),
    innovationLens: z.object({
      score: z.number().min(0).max(100),
      signals: z.array(z.string())
    }),
    recommendations: z.array(z.string())
  })
});

export type BmcResponse = z.infer<typeof bmcResponseSchema>;

/**
 * JSON Schema equivalent passed to the Anthropic API output_config so the model
 * is forced to return exactly this shape. Keep in sync with the Zod schema above.
 */
export const bmcJsonSchema = {
  type: "object",
  required: ["company", "blocks", "sources", "analysis"],
  properties: {
    company: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        legalName: { type: "string" },
        country: { type: "string" },
        sector: { type: "string" },
        website: { type: "string" },
        description: { type: "string" }
      }
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "rank", "category"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          url: { type: "string" },
          publisher: { type: "string" },
          date: { type: "string" },
          rank: { type: "integer", minimum: 1, maximum: 7 },
          category: { type: "string" }
        }
      }
    },
    blocks: {
      type: "object",
      required: BLOCK_ORDER,
      properties: Object.fromEntries(
        BLOCK_ORDER.map((id) => [
          id,
          {
            type: "object",
            required: [
              "id",
              "items",
              "justification",
              "sources",
              "confidence",
              "status"
            ],
            properties: {
              id: { const: id },
              items: { type: "array", items: { type: "string" } },
              justification: { type: "string" },
              sources: { type: "array", items: { type: "string" } },
              confidence: { type: "number", minimum: 0, maximum: 100 },
              status: { enum: ["verified", "estimated", "incomplete"] },
              notes: { type: "string" },
              flags: { type: "array", items: { type: "string" } }
            }
          }
        ])
      )
    },
    analysis: {
      type: "object",
      required: ["summary", "swot", "coherence", "innovationLens", "recommendations"],
      properties: {
        summary: { type: "string" },
        swot: {
          type: "object",
          required: ["strengths", "weaknesses", "opportunities", "threats"],
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            threats: { type: "array", items: { type: "string" } }
          }
        },
        coherence: {
          type: "object",
          required: ["score", "notes"],
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            notes: { type: "array", items: { type: "string" } }
          }
        },
        innovationLens: {
          type: "object",
          required: ["score", "signals"],
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            signals: { type: "array", items: { type: "string" } }
          }
        },
        recommendations: { type: "array", items: { type: "string" } }
      }
    }
  }
} as const;
