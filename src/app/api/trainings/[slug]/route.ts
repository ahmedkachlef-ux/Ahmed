import { NextRequest, NextResponse } from "next/server";
import { safeConnect } from "@/lib/db";
import { Training } from "@/models/Training";
import { SAMPLE_TRAININGS } from "@/lib/sampleData";

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const conn = await safeConnect();
  let item: any = null;
  if (conn) item = await Training.findOne({ slug: params.slug }).lean();
  if (!item) item = SAMPLE_TRAININGS.find(s => s.slug === params.slug) || null;
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const related = SAMPLE_TRAININGS.filter(s => s.category === item.category && s.slug !== item.slug).slice(0, 3);
  return NextResponse.json({ item, related });
}
