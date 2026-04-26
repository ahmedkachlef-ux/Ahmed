import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { getSession, requireRole } from "@/lib/auth";
import { buildUserRows, EXPORT_COLUMNS } from "@/lib/exportRows";
import { ActivityLog } from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
  const s = await getSession();
  const guard = requireRole(s, ["admin", "super_admin"]);
  if (guard) return guard;
  const { searchParams } = new URL(req.url);
  const filters = {
    q: searchParams.get("q") || undefined,
    status: searchParams.get("status") || undefined,
    role: searchParams.get("role") || undefined,
    gender: searchParams.get("gender") || undefined
  };
  const rows = await buildUserRows(filters);
  const aoa = [EXPORT_COLUMNS.map(c => c.label), ...rows.map(r => EXPORT_COLUMNS.map(c => (r as any)[c.key] ?? ""))];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = EXPORT_COLUMNS.map(c => ({ wch: Math.min(28, Math.max(c.label.length + 2, 12)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Users");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  await ActivityLog.create({ actor: s!.sub, actorRole: s!.role, action: "export_xlsx", target: "users", metadata: { count: rows.length, filters } });
  const fileName = `advancia-users-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`
    }
  });
}
