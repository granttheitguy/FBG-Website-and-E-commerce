import { ReactNode } from "react"
import Link from "next/link"

interface EmptyStateProps {
    icon: ReactNode
    title: string
    description: string
    action?: {
        label: string
        href: string
    }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-obsidian-50 rounded-full flex items-center justify-center mb-4 text-obsidian-400">
                {icon}
            </div>
            <h3 className="text-lg font-medium text-obsidian-900 mb-2">{title}</h3>
            <p className="text-sm text-obsidian-600 max-w-sm mb-6">{description}</p>
            {action && (
                <Link
                    href={action.href}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-sm text-white bg-obsidian-900 hover:bg-obsidian-800 transition-colors tracking-wide"
                >
                    {action.label}
                </Link>
            )}
        </div>
    )
}
