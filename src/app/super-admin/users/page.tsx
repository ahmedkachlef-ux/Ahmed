import { UsersTable } from "@/components/UsersTable";

export default function SuperUsers() {
  return (<>
    <h1 className="font-display font-extrabold text-2xl">All users</h1>
    <UsersTable allowSuper />
  </>);
}
