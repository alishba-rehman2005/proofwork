export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/reviewer/:path*", "/recruiter/:path*", "/admin/:path*"],
};
