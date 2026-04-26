import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export function RoleGuard({ allowedRoles, children, fallback = "/" }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#177529] mx-auto" />
          <p className="mt-3 text-sm text-gray-400 font-[Lexend]">Loading...</p>
        </div>
      </div>
    );
  }

  // NOt signed in at all
  if (!user) return <Navigate to="/auth" replace />;

  const role = user.publicMetadata?.role;

  // Role not in allowed list
  if (!allowedRoles.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

    return children;
}
