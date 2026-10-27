import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleLocale = createMiddleware(routing);

export function proxy(request: Parameters<typeof handleLocale>[0]) {
  return handleLocale(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
