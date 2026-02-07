import * as React from "react"
import LoadingSpinner from "./LoadingSpinner"

type ButtonVariant = "primary" | "primary-gold" | "secondary" | "ghost" | "danger" | "link" | "default" | "outline"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    fullWidth?: boolean
    children: React.ReactNode
}

export function Button({
    className = "",
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

    const variantStyles: Record<ButtonVariant, string> = {
        primary: "bg-obsidian-900 text-white hover:bg-obsidian-800 active:bg-obsidian-950",
        "primary-gold": "bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-600",
        secondary: "border border-obsidian-300 bg-white text-obsidian-900 hover:bg-obsidian-50 active:bg-obsidian-100",
        ghost: "text-obsidian-900 hover:bg-obsidian-50 active:bg-obsidian-100",
        danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        link: "text-obsidian-900 underline underline-offset-4 hover:text-obsidian-600 p-0 h-auto",
        // Backwards compatibility
        default: "bg-obsidian-900 text-white hover:bg-obsidian-800 active:bg-obsidian-950",
        outline: "border border-obsidian-300 bg-white text-obsidian-900 hover:bg-obsidian-50 active:bg-obsidian-100",
    }

    const sizeStyles: Record<ButtonSize, string> = {
        sm: "h-9 px-4 text-xs tracking-wide rounded-sm",
        md: "h-11 px-6 text-sm tracking-wide rounded-sm",
        lg: "h-13 px-8 text-sm tracking-wide rounded-sm",
    }

    const widthStyle = fullWidth ? "w-full" : ""

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${variant !== "link" ? sizeStyles[size] : "text-sm"} ${widthStyle} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {children}
                </>
            ) : (
                children
            )}
        </button>
    )
}
