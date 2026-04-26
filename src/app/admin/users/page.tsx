import { UsersTable } from "@/components/UsersTable";

export default function AdminUsersPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl">Learners</h1>
          <p className="text-sm text-ink-500">Create, edit, activate, deactivate or delete user accounts.</p>
        </div>
      </div>
      <UsersTable />
    </>
  );
}
