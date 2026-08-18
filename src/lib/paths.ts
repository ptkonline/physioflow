import type { Role } from "./types";

export function homePath(role: Role) {
  return role === "physio" ? "/physio" : "/patient";
}
