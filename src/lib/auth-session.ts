import type { Role } from "./types";

export const ROLE_COOKIE = "pf_role";
export const UID_COOKIE = "pf_uid";

export type PortalRole = "patient" | "doctor" | "staff";

export function portalRole(role: Role): PortalRole {
  if (role === "physio") return "doctor";
  if (role === "staff") return "staff";
  return "patient";
}

export function setAuthCookies(role: Role, userId: string) {
  const portal = portalRole(role);
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${ROLE_COOKIE}=${portal}; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
  document.cookie = `${UID_COOKIE}=${userId}; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearAuthCookies() {
  document.cookie = `${ROLE_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
  document.cookie = `${UID_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}
