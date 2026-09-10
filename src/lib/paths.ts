import type { Role } from "./types";

export function homePath(role: Role) {
  if (role === "physio") return "/doctor/dashboard";
  if (role === "staff") return "/staff/bookings";
  return "/patient/dashboard";
}

export function isPatientPath(pathname: string) {
  return pathname === "/patient" || pathname.startsWith("/patient/");
}

export function isStaffPath(pathname: string) {
  return pathname === "/staff" || pathname.startsWith("/staff/");
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
