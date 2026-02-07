"use client"

import { AlertTriangle } from "lucide-react"

interface FabricStockAlertProps {
    quantityYards: number
    minStockLevel: number
}

export default function FabricStockAlert({ quantityYards, minStockLevel }: FabricStockAlertProps) {
    if (minStockLevel <= 0 || quantityYards > minStockLevel) {
        return null
    }

    const deficit = (minStockLevel - quantityYards).toFixed(1)

    return (
        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{deficit} yards below minimum</span>
        </span>
    )
}
