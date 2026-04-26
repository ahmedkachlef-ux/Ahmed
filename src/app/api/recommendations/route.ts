import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { safeConnect } from "@/lib/db";
import { User } from "@/models/User";
import { topRecommendations } from "@/lib/recommend";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";
  const session = await getSession();
  let dept = ""; let interests: string[] = []; let focus: string[] = [];
  if (session) {
    const conn = await safeConnect();
    if (conn) {
      const u = await User.findById(session.sub).lean<any>();
      if (u) { dept = u.department || ""; interests = u.interests || []; focus = u.focusTracks || []; }
    }
  }
  const recos = topRecommendations({ department: dept, interests, focusTracks: focus, searchHistory: search ? [search] : [] }, 8);
  return NextResponse.json({ items: recos });
}
