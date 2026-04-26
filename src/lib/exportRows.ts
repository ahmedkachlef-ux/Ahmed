import { connectDB } from "./db";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";

export const EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: "userId", label: "User ID" },
  { key: "recordId", label: "Record ID" },
  { key: "fullName", label: "Full name" },
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "gender", label: "Gender" },
  { key: "age", label: "Age" },
  { key: "department", label: "Post / Department" },
  { key: "role", label: "Role" },
  { key: "company", label: "Company" },
  { key: "status", label: "Status" },
  { key: "active", label: "Active" },
  { key: "trainingState", label: "Training state" },
  { key: "inTraining", label: "In training" },
  { key: "currentTraining", label: "Current training" },
  { key: "trainingCode", label: "Training code" },
  { key: "trainingCategory", label: "Training category" },
  { key: "trainingFormat", label: "Training format" },
  { key: "trainerName", label: "Trainer" },
  { key: "trainingStart", label: "Training start" },
  { key: "trainingEnd", label: "Training end" },
  { key: "enrollmentStatus", label: "Enrollment status" },
  { key: "progressPercent", label: "Progress %" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "State / Address" },
  { key: "authProvider", label: "Auth provider" },
  { key: "emailVerified", label: "Email verified" },
  { key: "onboardingCompleted", label: "Onboarding completed" },
  { key: "focusTracks", label: "Focus tracks" },
  { key: "joinedDate", label: "Joined date" },
  { key: "lastLogin", label: "Last login" }
];

export type Filters = { q?: string; status?: string; role?: string; gender?: string };

export async function buildUserRows(filters: Filters = {}) {
  await connectDB();
  const filter: any = {};
  if (filters.status) filter.status = filters.status;
  if (filters.role) filter.role = filters.role;
  if (filters.gender) filter.gender = filters.gender;
  if (filters.q) filter.$or = [
    { email: { $regex: filters.q, $options: "i" } },
    { fullName: { $regex: filters.q, $options: "i" } },
    { company: { $regex: filters.q, $options: "i" } }
  ];
  const users: any[] = await User.find(filter).lean();
  const ens: any[] = await Enrollment.find({ user: { $in: users.map(u => u._id) } }).populate("training").sort("-createdAt").lean();
  const map = new Map<string, any[]>();
  ens.forEach(e => {
    const k = String(e.user);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(e);
  });
  return users.map(u => {
    const list = map.get(String(u._id)) || [];
    const cur = list.find(x => x.status === "accepted") || list[0];
    const sess = cur?.training?.sessions?.[0];
    return {
      userId: String(u._id),
      recordId: u.recordId || "",
      fullName: u.fullName || "",
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      gender: u.gender || "",
      age: u.age ?? "",
      department: u.department || "",
      role: u.role,
      company: u.company || "",
      status: u.status,
      active: u.active ? "Yes" : "No",
      trainingState: cur ? (cur.status === "completed" ? "completed" : "in_progress") : "none",
      inTraining: cur ? "Yes" : "No",
      currentTraining: cur?.training?.title || "",
      trainingCode: cur?.training?.code || "",
      trainingCategory: cur?.training?.category || "",
      trainingFormat: cur?.training?.format || "",
      trainerName: cur?.training?.trainer || "",
      trainingStart: sess?.startDate ? new Date(sess.startDate).toISOString().slice(0, 10) : "",
      trainingEnd: sess?.endDate ? new Date(sess.endDate).toISOString().slice(0, 10) : "",
      enrollmentStatus: cur?.status || "",
      progressPercent: cur?.progress ?? "",
      email: u.email || "",
      phone: u.phone || "",
      address: u.address || "",
      authProvider: u.authProvider || "password",
      emailVerified: u.emailVerified ? "Yes" : "No",
      onboardingCompleted: u.onboardingCompleted ? "Yes" : "No",
      focusTracks: (u.focusTracks || []).join(", "),
      joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "",
      lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString().slice(0, 10) : ""
    };
  });
}
