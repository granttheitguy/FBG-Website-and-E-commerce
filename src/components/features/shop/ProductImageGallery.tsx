"use client"

import { useState } from "react"

interface ProductImageGalleryProps {
    images: string[]
    productName: string
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const hasImages = images.length > 0
    const currentImage = hasImages ? images[selectedIndex] : null

    return (
        <div className="flex gap-4">
            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div
                    className="hidden sm:flex flex-col gap-3 shrink-0"
                    role="tablist"
                    aria-label="Product image thumbnails"
                >
                    {images.slice(0, 4).map((imageUrl, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            role="tab"
                            aria-selected={selectedIndex === index}
                            aria-label={`View image ${index + 1} of ${Math.min(images.length, 4)}`}
                            className={`w-20 h-20 rounded-sm overflow-hidden border-2 transition-all shrink-0 ${
                                selectedIndex === index
                                    ? "border-obsidian-900 opacity-100"
                                    : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                        >
                            <img
                                src={imageUrl}
                                alt={`${productName} thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main Image */}
            <div
                className="flex-1 aspect-[3/4] bg-obsidian-100 rounded-sm overflow-hidden"
                role="tabpanel"
                aria-label={`Product image ${selectedIndex + 1}`}
            >
                {currentImage ? (
                    <img
                        src={currentImage}
                        alt={`${productName} - Image ${selectedIndex + 1}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-obsidian-400">
                        No Image
                    </div>
                )}
            </div>
        </div>
    )
}
