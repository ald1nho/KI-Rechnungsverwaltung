import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const receiptButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-card transition-smooth",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-card transition-smooth",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-card transition-smooth",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-smooth",
        link: "text-primary underline-offset-4 hover:underline",
        camera: "gradient-primary text-primary-foreground shadow-float hover:shadow-elegant transition-bounce scale-100 hover:scale-[1.02] active:scale-[0.98]",
        upload: "border-2 border-dashed border-muted-foreground/30 bg-muted/50 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-smooth",
        category: "bg-card border border-border hover:border-primary hover:shadow-card transition-smooth text-left p-4",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        camera: "h-16 w-16 rounded-2xl",
        card: "p-6 h-auto w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ReceiptButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof receiptButtonVariants> {
  asChild?: boolean;
}

const ReceiptButton = React.forwardRef<HTMLButtonElement, ReceiptButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(receiptButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
ReceiptButton.displayName = "ReceiptButton";

export { ReceiptButton, receiptButtonVariants };