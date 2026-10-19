"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, ConstellationIcon, StarIcon, SunriseIcon, VeraIcon } from "./icons";

const tabs = [
  { href: "/", label: "Heading", Icon: CompassIcon },
  { href: "/morning", label: "Morning", Icon: SunriseIcon },
  { href: "/stars", label: "Stars", Icon: StarIcon },
  { href: "/constellations", label: "Habits", Icon: ConstellationIcon },
  { href: "/vera", label: "Vera", Icon: VeraIcon },
];

export function BottomNav(props: { static?: boolean }) {
  return props.static ? <Nav path={null} /> : <LiveNav />;
}

function LiveNav() {
  return <Nav path={usePathname()} />;
}

/** `path` is null in the prerendered shell; the live nav swaps in with the active tab. */
function Nav({ path }: { path: string | null }) {
  const active = (href: string) => {
    if (path === null) return false;
    if (href === "/") return path === "/" || path.startsWith("/calendar") || path.startsWith("/day");
    return path.startsWith(href);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-night-700/70 bg-night-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const on = active(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  on ? "text-accent" : "text-ink-faint"
                }`}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
