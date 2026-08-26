import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/controlplane-data";
import { STATUS_LABEL } from "@/lib/controlplane-data";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        pass: "border-pass/25 bg-pass-soft text-pass-foreground",
        patch: "border-patch/30 bg-patch-soft text-patch-foreground",
        escalate: "border-escalate/30 bg-escalate-soft text-escalate-foreground",
        block: "border-block/25 bg-block-soft text-block-foreground",
      },
    },
    defaultVariants: { status: "pass" },
  },
);

const dot: Record<Status, string> = {
  pass: "bg-pass",
  patch: "bg-patch",
  escalate: "bg-escalate",
  block: "bg-block",
};

export function StatusBadge({
  status,
  className,
}: { status: Status } & VariantProps<typeof badge> & { className?: string }) {
  return (
    <span className={cn(badge({ status }), className)}>
      <span className={cn("size-1.5 rounded-full", dot[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function CategoryPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
      {label}
    </span>
  );
}
