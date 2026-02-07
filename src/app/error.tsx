"use client"

import { useEffect } from "react"
import ErrorMessage from "@/components/ui/ErrorMessage"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log error to error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-primary">
            <ErrorMessage
                title="Oops! Something went wrong"
                message="We're sorry, but something unexpected happened. Please try again or contact support if the problem persists."
                onRetry={reset}
            />
        </div>
    )
}
