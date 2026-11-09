import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-primary)] [a]:hover:bg-primary/80",
        brand:
          "border-brand/25 bg-brand/10 text-brand shadow-[var(--shadow-badge)] [a]:hover:bg-brand/15 dark:border-brand/35 dark:bg-brand/15 dark:text-brand",
        secondary:
          "bg-card text-foreground shadow-[var(--shadow-button)] [a]:hover:bg-muted dark:bg-secondary dark:[a]:hover:bg-accent",
        destructive:
          "bg-destructive/10 text-destructive shadow-[var(--shadow-badge)] focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "bg-card text-foreground shadow-[var(--shadow-button)] [a]:hover:bg-muted [a]:hover:text-muted-foreground dark:bg-transparent",
        success:
          "border-transparent bg-success/10 text-success shadow-[var(--shadow-badge)] [a]:hover:bg-success/20",
        warning:
          "border-transparent bg-warning/15 text-warning-foreground shadow-[var(--shadow-badge)] [a]:hover:bg-warning/25",
        info: "border-transparent bg-info/10 text-info shadow-[var(--shadow-badge)] [a]:hover:bg-info/20",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
export type BadgeProps = useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;
