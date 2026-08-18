import type { Role } from "./types";

export function homePath(role: Role) {
  if (role === "physio") return "/physio";
  if (role === "staff") return "/staff";
  return "/patient";
}
