import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { getAccessToken, getUserRole, type UserRole } from "./auth";

type PrivateRouteProps = {
  children: ReactElement;
  role?: UserRole;
};

export default function PrivateRoute({ children, role }: PrivateRouteProps) {
  const token = getAccessToken();
  const userRole = getUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
