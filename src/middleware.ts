import { withAuth } from "next-auth/middleware";

// Anyone not signed in is sent to our /login page. (The middleware doesn't read
// authOptions, so the page has to be repeated here.) Server actions re-check
// the session themselves, so this is not the only guard.
export default withAuth({ pages: { signIn: "/login" } });

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
