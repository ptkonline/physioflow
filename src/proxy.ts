import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_COOKIE } from "@/lib/auth-session";
import { isDoctorOnboardingPath, isDoctorPath, isPatientPath } from "@/lib/paths";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  if (isDoctorOnboardingPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/physio" || pathname.startsWith("/physio/")) {
    const mapped = pathname
      .replace(/^\/physio\/bookings/, "/doctor/appointments")
      .replace(/^\/physio$/, "/doctor/dashboard")
      .replace(/^\/physio/, "/doctor");
    const url = request.nextUrl.clone();
    url.pathname = mapped;
    return NextResponse.redirect(url);
  }

  if (!isPatientPath(pathname) && !isDoctorPath(pathname)) {
    return NextResponse.next();
  }

  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (role === "patient" && isDoctorPath(pathname)) {
    return NextResponse.redirect(new URL("/patient/dashboard", request.url));
  }

  if (role === "doctor" && isPatientPath(pathname)) {
    return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/physio/:path*", "/patient", "/doctor", "/physio"],
};
