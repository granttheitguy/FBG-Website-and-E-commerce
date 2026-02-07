"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Plus, Edit, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface Address {
    id: string
    label: string
    firstName: string
    lastName: string
    address1: string
    address2: string | null
    city: string
    state: string
    postalCode: string | null
    phone: string
    isDefault: boolean
}

interface AddressesClientProps {
    initialAddresses: Address[]
}

const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
]

export default function AddressesClient({ initialAddresses }: AddressesClientProps) {
    const router = useRouter()
    const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState<Address | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        label: "Home",
        firstName: "",
        lastName: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        postalCode: "",
        phone: "",
        isDefault: false
    })

    const resetForm = () => {
        setFormData({
            label: "Home",
            firstName: "",
            lastName: "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            postalCode: "",
            phone: "",
            isDefault: false
        })
        setEditingAddress(null)
        setError("")
    }

    const openModal = (address?: Address) => {
        if (address) {
            setEditingAddress(address)
            setFormData({
                label: address.label,
                firstName: address.firstName,
                lastName: address.lastName,
                address1: address.address1,
                address2: address.address2 || "",
                city: address.city,
                state: address.state,
                postalCode: address.postalCode || "",
                phone: address.phone,
                isDefault: address.isDefault
            })
        } else {
            resetForm()
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        resetForm()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const url = editingAddress
                ? `/api/addresses/${editingAddress.id}`
                : "/api/addresses"

            const method = editingAddress ? "PATCH" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to save address")
            }

            router.refresh()
            closeModal()
        } catch (err: any) {
            setError(err.message || "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return

        setIsLoading(true)
        try {
            const res = await fetch(`/api/addresses/${id}`, {
                method: "DELETE"
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to delete address")
            }

            router.refresh()
        } catch (err: any) {
            alert(err.message || "Failed to delete address")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="mb-6">
                <Button
                    onClick={() => openModal()}
                    className="bg-gold-500 hover:bg-gold-600 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Address
                </Button>
            </div>

            {addresses.length === 0 ? (
                <div className="text-center py-12 bg-obsidian-50 rounded-sm">
                    <MapPin className="w-12 h-12 text-obsidian-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-obsidian-900 mb-2">No addresses saved</h3>
                    <p className="text-obsidian-500 mb-4">Add your first delivery address to get started.</p>
                    <Button
                        onClick={() => openModal()}
                        className="bg-gold-500 hover:bg-gold-600 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className="border border-obsidian-200 rounded-sm p-4 hover:border-gold-500 transition-colors relative"
                        >
                            {address.isDefault && (
                                <div className="absolute top-4 right-4">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold-100 text-gold-700 text-xs font-medium rounded-sm">
                                        <Check className="w-3 h-3" />
                                        Default
                                    </span>
                                </div>
                            )}

                            <div className="mb-4">
                                <p className="text-sm font-medium text-gold-600 mb-2">{address.label}</p>
                                <p className="font-medium text-obsidian-900">
                                    {address.firstName} {address.lastName}
                                </p>
                                <p className="text-sm text-obsidian-600 mt-1">{address.address1}</p>
                                {address.address2 && (
                                    <p className="text-sm text-obsidian-600">{address.address2}</p>
                                )}
                                <p className="text-sm text-obsidian-600">
                                    {address.city}, {address.state}
                                    {address.postalCode && ` ${address.postalCode}`}
                                </p>
                                <p className="text-sm text-obsidian-600 mt-1">{address.phone}</p>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-obsidian-100">
                                <Button
                                    onClick={() => openModal(address)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 min-h-[48px]"
                                    aria-label="Edit address"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => handleDelete(address.id)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 min-h-[48px] text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={isLoading}
                                    aria-label="Delete address"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-obsidian-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-medium text-obsidian-900">
                                {editingAddress ? "Edit Address" : "Add New Address"}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-obsidian-400 hover:text-obsidian-600 min-w-[48px] min-h-[48px] flex items-center justify-center"
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <Label htmlFor="label">Address Label</Label>
                                <Input
                                    id="label"
                                    type="text"
                                    value={formData.label}
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                    placeholder="e.g., Home, Office, etc."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="e.g., +234 803 123 4567"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="address1">Street Address</Label>
                                <Input
                                    id="address1"
                                    type="text"
                                    value={formData.address1}
                                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                                    placeholder="House number and street name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="address2">Apartment, Suite, etc. (Optional)</Label>
                                <Input
                                    id="address2"
                                    type="text"
                                    value={formData.address2}
                                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                                    placeholder="Apartment, suite, unit, etc."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="state">State</Label>
                                    <select
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full px-3 py-2 border border-obsidian-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500 min-h-[48px]"
                                        required
                                    >
                                        <option value="">Select State</option>
                                        {NIGERIAN_STATES.map((state) => (
                                            <option key={state} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                                <Input
                                    id="postalCode"
                                    type="text"
                                    value={formData.postalCode}
                                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                    placeholder="e.g., 100001"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={formData.isDefault}
                                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                    className="w-4 h-4 text-gold-600 border-obsidian-300 rounded focus:ring-gold-500"
                                />
                                <Label htmlFor="isDefault" className="cursor-pointer">
                                    Set as default delivery address
                                </Label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-obsidian-100">
                                <Button
                                    type="button"
                                    onClick={closeModal}
                                    variant="outline"
                                    className="flex-1 min-h-[48px]"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 min-h-[48px] bg-gold-500 hover:bg-gold-600 text-white"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Saving..." : editingAddress ? "Update Address" : "Add Address"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
