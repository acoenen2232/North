import { brandIcon } from "@/lib/brand-icon";

// /pwa-icon/192, /pwa-icon/512, /pwa-icon/maskable — referenced by the web app manifest.
export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[variant]">) {
  const { variant } = await ctx.params;
  if (variant === "maskable") return brandIcon(512, { maskable: true });
  return brandIcon(variant === "192" ? 192 : 512);
}
