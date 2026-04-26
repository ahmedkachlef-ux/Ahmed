import { DashboardShell } from "@/components/DashboardShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      title="Admin"
      subtitle="Operate ADVANCIA"
      items={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/users", label: "Learners" },
        { href: "/admin/enrollments", label: "Enrollments" },
        { href: "/admin/exports", label: "Reports & exports" }
      ]}
    >
      {children}
    </DashboardShell>
  );
}
