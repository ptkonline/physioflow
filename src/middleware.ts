/**
 * Next.js 16 runs the request interceptor from `src/proxy.ts` (not `middleware.ts`).
 * This re-export keeps the classic middleware filename for tooling and reviews.
 * Admin UID comparison lives in `guardAdmin` inside `proxy.ts` and uses a signed
 * httpOnly cookie — never a public `NEXT_PUBLIC_ADMIN_UID` check.
 */
export { proxy as middleware, config } from "./proxy";
