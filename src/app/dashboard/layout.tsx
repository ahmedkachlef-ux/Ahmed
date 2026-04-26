import { DashboardShell } from "@/components/DashboardShell";

export default function UserDashLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      title="My space"
      subtitle="ADVANCIA Trainings"
      items={[
        { href: "/dashboard", label: "Overview" },
        { href: "/dashboard/profile", label: "Profile" },
        { href: "/dashboard/payments", label: "Payments" },
        { href: "/dashboard/notifications", label: "Notifications" }
      ]}
    >
      {children}
    </DashboardShell>
  );
}
