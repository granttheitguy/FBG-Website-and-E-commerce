interface SkeletonCardProps {
    count?: number
}

export default function SkeletonCard({ count = 1 }: SkeletonCardProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i}>
                    {/* Image skeleton with shimmer */}
                    <div className="aspect-[3/4] rounded-sm mb-3 animate-shimmer"></div>

                    {/* Text skeletons */}
                    <div className="space-y-2.5">
                        <div className="h-4 rounded-sm animate-shimmer w-3/4"></div>
                        <div className="h-3 rounded-sm animate-shimmer w-1/2"></div>
                        <div className="h-4 rounded-sm animate-shimmer w-1/4"></div>
                    </div>
                </div>
            ))}
        </>
    )
}
