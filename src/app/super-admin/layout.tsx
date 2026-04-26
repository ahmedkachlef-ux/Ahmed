import { DashboardShell } from "@/components/DashboardShell";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      title="Super Admin"
      subtitle="Govern ADVANCIA"
      items={[
        { href: "/super-admin", label: "Overview" },
        { href: "/super-admin/users", label: "Users" },
        { href: "/super-admin/admins", label: "Admins" },
        { href: "/super-admin/trainings", label: "Trainings" },
        { href: "/super-admin/logs", label: "Activity logs" },
        { href: "/super-admin/exports", label: "Exports" }
      ]}
    >
      {children}
    </DashboardShell>
  );
}
