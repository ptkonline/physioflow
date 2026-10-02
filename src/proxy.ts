import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, adminEnv, isAdminPath, readAdminToken } from "@/lib/admin-session";
import { ROLE_COOKIE } from "@/lib/auth-session";
import { isDoctorOnboardingPath, isDoctorPath, isPatientPath } from "@/lib/paths";

async function guardAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isAdminPath(pathname) || pathname === "/admin/login") return null;

  const env = adminEnv();
  if (!env.ready) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "env");
    return NextResponse.redirect(url);
  }

  const session = await readAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminResponse = await guardAdmin(request);
  if (adminResponse) return adminResponse;

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

  // Cookie value is portal role "doctor" (see portalRole); accept legacy "physio" too.
  if ((role === "doctor" || role === "physio") && isPatientPath(pathname)) {
    return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/physio/:path*",
    "/patient",
    "/doctor",
    "/physio",
    "/admin",
    "/admin/:path*",
  ],
};
