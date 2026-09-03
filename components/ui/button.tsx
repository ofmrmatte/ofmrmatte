import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b8c86]/25 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#08756f] text-white shadow-sm hover:bg-[#066660] hover:-translate-y-0.5 hover:shadow-md",
        outline:
          "border border-[#d7e1e4] bg-white text-[#183241] shadow-sm hover:border-[#0b8c86]/25 hover:bg-[#f7fbfa] hover:-translate-y-0.5"
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-12 rounded-xl px-5 text-[0.95rem]"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
