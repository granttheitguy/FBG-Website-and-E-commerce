"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface CartItem {
    id: string // product id + variant sku
    productId: string
    variantId: string
    name: string
    price: number
    image?: string
    quantity: number
    size: string
    slug: string
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: Omit<CartItem, "id">) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    cartCount: number
    cartTotal: number
    isCartOpen: boolean
    setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("fbg-cart")
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (e) {
                console.error("Failed to parse cart", e)
            }
        }
        setIsInitialized(true)
    }, [])

    // Save cart to local storage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("fbg-cart", JSON.stringify(items))
        }
    }, [items, isInitialized])

    const addItem = (newItem: Omit<CartItem, "id">) => {
        setItems((prev) => {
            const id = `${newItem.productId}-${newItem.size}`
            const existingItem = prev.find((item) => item.id === id)

            if (existingItem) {
                return prev.map((item) =>
                    item.id === id
                        ? { ...item, quantity: item.quantity + newItem.quantity }
                        : item
                )
            }

            return [...prev, { ...newItem, id }]
        })
        setIsCartOpen(true)
    }

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id))
    }

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(id)
            return
        }
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        )
    }

    const clearCart = () => {
        setItems([])
    }

    const cartCount = items.reduce((total, item) => total + item.quantity, 0)
    const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                cartCount,
                cartTotal,
                isCartOpen,
                setIsCartOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
