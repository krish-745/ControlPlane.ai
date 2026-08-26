import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, WifiOff } from "lucide-react";
import { fetchHealth } from "@/lib/api";

const TABS = [
  { to: "/", label: "Monitor" },
  { to: "/policy", label: "Policy" },
  { to: "/trust", label: "Trust" },
  { to: "/audit", label: "Audit" },
] as const;

type HealthState = "unknown" | "ok" | "offline";

export function TopNav() {
  const [health, setHealth] = useState<HealthState>("unknown");
  const [backend, setBackend] = useState<string>("");

  useEffect(() => {
    async function check() {
      const data = await fetchHealth();
      if (data) {
        setHealth(data.status === "ok" ? "ok" : "offline");
        setBackend(data.backend ?? "");
      } else {
        setHealth("offline");
      }
    }

    check();
    const t = setInterval(check, 10_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-8 px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">ControlPlane</span>
        </Link>

        <nav className="flex h-full items-stretch gap-1">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.to === "/" }}
              className="relative flex items-center px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{
                className:
                  "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
              }}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          {health === "ok" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/25 bg-pass-soft px-2.5 py-1 font-medium text-pass-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-pass" />
              Gateway healthy
              {backend && (
                <span className="hidden sm:inline opacity-70">· {backend}</span>
              )}
            </span>
          ) : health === "offline" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-block/25 bg-block-soft px-2.5 py-1 font-medium text-block-foreground">
              <WifiOff className="size-3" />
              Backend offline
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-1 font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-muted-foreground opacity-50" />
              Connecting…
            </span>
          )}
          <span className="hidden sm:inline">v2.4.1</span>
        </div>
      </div>
    </header>
  );
}
