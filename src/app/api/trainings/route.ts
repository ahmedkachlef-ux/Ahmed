import { NextRequest, NextResponse } from "next/server";
import { safeConnect } from "@/lib/db";
import { Training } from "@/models/Training";
import { SAMPLE_TRAININGS } from "@/lib/sampleData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const category = searchParams.get("category") || "";
  const level = searchParams.get("level") || "";
  const format = searchParams.get("format") || "";
  const sort = searchParams.get("sort") || "popular";

  const conn = await safeConnect();
  let items: any[] = [];
  if (conn) {
    const filter: any = { state: "published" };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (format) filter.format = format;
    if (q) filter.$or = [{ title: { $regex: q, $options: "i" } }, { tags: { $regex: q, $options: "i" } }, { summary: { $regex: q, $options: "i" } }];
    items = await Training.find(filter).lean();
  }
  if (!items.length) items = SAMPLE_TRAININGS as any[];

  let filtered = items.filter((t: any) => {
    if (category && t.category !== category) return false;
    if (level && t.level !== level) return false;
    if (format && t.format !== format) return false;
    if (q && !`${t.title} ${(t.tags || []).join(" ")} ${t.summary || ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sort === "duration") return (a.durationHours || 0) - (b.durationHours || 0);
    if (sort === "price") return (a.price || 0) - (b.price || 0);
    return (b.popularity || 0) - (a.popularity || 0);
  });

  return NextResponse.json({ items: filtered });
}
