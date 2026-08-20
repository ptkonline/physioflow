import type { Role } from "./types";

export function homePath(role: Role) {
  return role === "physio" ? "/doctor/dashboard" : "/patient/dashboard";
}

export function isPatientPath(pathname: string) {
  return pathname === "/patient" || pathname.startsWith("/patient/");
}

export function isDoctorOnboardingPath(pathname: string) {
  return pathname === "/doctor/onboarding" || pathname.startsWith("/doctor/onboarding/");
}

export function isDoctorPath(pathname: string) {
  return (
    pathname === "/doctor" ||
    pathname.startsWith("/doctor/") ||
    pathname === "/physio" ||
    pathname.startsWith("/physio/")
  );
}
