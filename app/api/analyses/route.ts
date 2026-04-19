import { store } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await store().listAnalyses();
  return Response.json({ items });
}
