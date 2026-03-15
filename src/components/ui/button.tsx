import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import React from "react";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-primary text-white shadow-sm hover:bg-primary/90 hover:shadow-md",
				destructive: "bg-error text-white shadow-sm hover:bg-error/90",
				outline:
					"border border-border bg-transparent text-text hover:bg-tertiary hover:border-primary hover:text-primary",
				ghost: "text-text-muted hover:bg-tertiary hover:text-primary",
				icon: "text-text-muted hover:bg-tertiary hover:text-primary",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-7 px-3 text-xs",
				lg: "h-11 px-8",
				icon: "h-8 w-8",
				"icon-sm": "h-6 w-6",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
