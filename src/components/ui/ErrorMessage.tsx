import { AlertCircle } from "lucide-react"

interface ErrorMessageProps {
    title?: string
    message: string
    onRetry?: () => void
}

export default function ErrorMessage({
    title = "Something went wrong",
    message,
    onRetry
}: ErrorMessageProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-obsidian-900 mb-2">{title}</h3>
            <p className="text-sm text-obsidian-600 max-w-sm mb-6">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center px-6 py-3 border border-obsidian-200 text-sm font-medium rounded-sm text-obsidian-700 bg-white hover:bg-obsidian-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-colors"
                >
                    Try Again
                </button>
            )}
        </div>
    )
}
