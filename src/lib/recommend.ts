import { SAMPLE_TRAININGS, type FullTraining } from "./sampleData";

export type RecoUser = {
  department?: string;
  interests?: string[];
  focusTracks?: string[];
  searchHistory?: string[];
};

export function rankTrainings(user: RecoUser, list: FullTraining[] = SAMPLE_TRAININGS): (FullTraining & { score: number })[] {
  const interests = new Set([...(user.interests || []), ...(user.focusTracks || []), ...(user.searchHistory || [])].map(s => s.toLowerCase()));
  const dept = (user.department || "").toLowerCase();
  return list
    .map(t => {
      let score = (t.popularity || 0) / 100; // 0..1 base
      const tagText = [t.title, t.category, ...(t.tags || [])].join(" ").toLowerCase();
      let matches = 0;
      interests.forEach(i => { if (i && tagText.includes(i)) matches += 1; });
      score += matches * 0.4;
      if (dept && tagText.includes(dept)) score += 0.3;
      score += (t.rating || 0) / 10;
      return { ...t, score: Math.round(score * 100) / 100 };
    })
    .sort((a, b) => b.score - a.score);
}

export function topRecommendations(user: RecoUser, n = 4) {
  return rankTrainings(user).slice(0, n);
}
