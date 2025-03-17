import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-xl active:scale-[0.98] shadow-[0_4px_14px_0_rgba(59,130,246,0.3)]",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 hover:shadow-xl active:scale-[0.98] shadow-[0_4px_14px_0_rgba(239,68,68,0.3)]",
        outline:
          "border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400 transition-all",
        secondary:
          "bg-gradient-to-r from-gray-600 to-gray-500 text-white hover:from-gray-700 hover:to-gray-600 hover:shadow-xl active:scale-[0.98] shadow-[0_4px_14px_0_rgba(100,116,139,0.3)]",
        ghost: "hover:bg-blue-50 hover:text-blue-700 text-gray-600",
        link: "text-blue-600 hover:text-blue-700 hover:underline underline-offset-4",
        success: "bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 hover:shadow-xl active:scale-[0.98] shadow-[0_4px_14px_0_rgba(34,197,94,0.3)]",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-lg",
        sm: "h-9 rounded-md px-4 py-2 text-xs",
        lg: "h-12 rounded-lg px-8 py-3 text-base",
        xl: "h-14 rounded-lg px-10 py-3.5 text-base font-semibold",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-12 w-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
