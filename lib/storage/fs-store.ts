import fs from "node:fs/promises";
import path from "node:path";
import type { Store } from "./index";
import { toSummary } from "./index";
import type { BmcAnalysis, Feedback, AnalysisSummary } from "../types";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const ANALYSES_DIR = path.join(DATA_DIR, "analyses");
const FEEDBACK_DIR = path.join(DATA_DIR, "feedback");

async function ensureDirs() {
  await fs.mkdir(ANALYSES_DIR, { recursive: true });
  await fs.mkdir(FEEDBACK_DIR, { recursive: true });
}

export function fsStore(): Store {
  return {
    async saveAnalysis(a: BmcAnalysis) {
      await ensureDirs();
      await fs.writeFile(
        path.join(ANALYSES_DIR, `${a.id}.json`),
        JSON.stringify(a, null, 2),
        "utf8"
      );
    },

    async getAnalysis(id: string) {
      await ensureDirs();
      try {
        const raw = await fs.readFile(path.join(ANALYSES_DIR, `${id}.json`), "utf8");
        return JSON.parse(raw) as BmcAnalysis;
      } catch {
        return null;
      }
    },

    async listAnalyses(): Promise<AnalysisSummary[]> {
      await ensureDirs();
      const files = (await fs.readdir(ANALYSES_DIR)).filter((f) => f.endsWith(".json"));
      const items = await Promise.all(
        files.map(async (f) => {
          try {
            const raw = await fs.readFile(path.join(ANALYSES_DIR, f), "utf8");
            return toSummary(JSON.parse(raw));
          } catch {
            return null;
          }
        })
      );
      return items
        .filter((x): x is AnalysisSummary => Boolean(x))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },

    async deleteAnalysis(id: string) {
      try {
        await fs.unlink(path.join(ANALYSES_DIR, `${id}.json`));
      } catch {
        // ignore
      }
    },

    async saveFeedback(f: Feedback) {
      await ensureDirs();
      await fs.writeFile(
        path.join(FEEDBACK_DIR, `${f.id}.json`),
        JSON.stringify(f, null, 2),
        "utf8"
      );
    },

    async listFeedback(analysisId?: string) {
      await ensureDirs();
      const files = (await fs.readdir(FEEDBACK_DIR)).filter((f) => f.endsWith(".json"));
      const items = await Promise.all(
        files.map(async (f) => {
          try {
            const raw = await fs.readFile(path.join(FEEDBACK_DIR, f), "utf8");
            return JSON.parse(raw) as Feedback;
          } catch {
            return null;
          }
        })
      );
      return items
        .filter((x): x is Feedback => !!x && (!analysisId || x.analysisId === analysisId))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
  };
}
