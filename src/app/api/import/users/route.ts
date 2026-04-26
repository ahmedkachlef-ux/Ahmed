import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSession, requireRole, hashPassword } from "@/lib/auth";
import { ActivityLog } from "@/models/ActivityLog";

export async function POST(req: NextRequest) {
  const s = await getSession();
  const guard = requireRole(s, ["admin", "super_admin"]);
  if (guard) return guard;
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);
  await connectDB();
  let inserted = 0; let updated = 0;
  for (const r of rows) {
    const email = String(r.email || r.Email || "").toLowerCase();
    if (!email) continue;
    const fullName = r.fullName || r["Full name"] || `${r.firstName || ""} ${r.lastName || ""}`.trim();
    const data: any = {
      email, fullName,
      firstName: r.firstName || r["First name"] || (fullName.split(" ")[0] || ""),
      lastName: r.lastName || r["Last name"] || fullName.split(" ").slice(1).join(" "),
      gender: r.gender || "unspecified",
      age: r.age ? Number(r.age) : undefined,
      department: r.department || r["Post / Department"] || "",
      company: r.company || "",
      role: r.role || "user",
      status: r.status || "active",
      authProvider: r.authProvider || "password"
    };
    const existing = await User.findOne({ email });
    if (existing) { await User.updateOne({ _id: existing._id }, data); updated++; }
    else {
      data.recordId = "REC-" + Date.now().toString(36).toUpperCase() + "-" + inserted;
      data.passwordHash = r.password ? await hashPassword(String(r.password)) : undefined;
      await User.create(data); inserted++;
    }
  }
  await ActivityLog.create({ actor: s!.sub, actorRole: s!.role, action: "import_users", target: "xlsx", metadata: { inserted, updated } });
  return NextResponse.json({ ok: true, inserted, updated });
}
