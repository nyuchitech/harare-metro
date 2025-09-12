import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent opacity-75 rounded-md", className)}
      {...props} />
  );
}

export { Skeleton }
