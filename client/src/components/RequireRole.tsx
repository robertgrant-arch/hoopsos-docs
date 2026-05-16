// RequireRole — redirects to the role's home page if the current user's role
// doesn't match. Use for page-level protection when nav filtering alone isn't enough.
//
// Example:
//   <RequireRole role="PARENT"><ParentDashboard /></RequireRole>
//   <RequireRole role={["COACH", "TEAM_ADMIN"]}><RosterPage /></RequireRole>

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ROLE_META, type Role } from "@/lib/mock/users";

interface Props {
  role: Role | Role[];
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RequireRole({ role, children, redirectTo }: Props) {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const allowed = Array.isArray(role) ? role : [role];
  const permitted = user && allowed.includes(user.role);

  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    } else if (!permitted) {
      navigate(redirectTo ?? ROLE_META[user.role].home);
    }
  }, [user, permitted, navigate, redirectTo]);

  if (!user || !permitted) return null;
  return <>{children}</>;
}
