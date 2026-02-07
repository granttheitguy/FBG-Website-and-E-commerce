"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react"

interface Collection {
    id: string
    name: string
    slug: string
    description: string | null
    isActive: boolean
    createdAt: string
    updatedAt: string
    _count: {
        products: number
    }
}

interface CollectionsClientProps {
    initialCollections: Collection[]
}

export default function CollectionsClient({ initialCollections }: CollectionsClientProps) {
    const router = useRouter()
    const [collections, setCollections] = useState<Collection[]>(initialCollections)
    const [showModal, setShowModal] = useState(false)
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
    const [loading, setLoading] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        isActive: true
    })

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }

    const handleNameChange = (value: string) => {
        setFormData({
            ...formData,
            name: value,
            slug: editingCollection ? formData.slug : generateSlug(value)
        })
    }

    const openCreateModal = () => {
        setEditingCollection(null)
        setFormData({ name: "", slug: "", description: "", isActive: true })
        setShowModal(true)
    }

    const openEditModal = (collection: Collection) => {
        setEditingCollection(collection)
        setFormData({
            name: collection.name,
            slug: collection.slug,
            description: collection.description || "",
            isActive: collection.isActive
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = editingCollection
                ? `/api/admin/collections/${editingCollection.id}`
                : "/api/admin/collections"

            const method = editingCollection ? "PATCH" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description || undefined,
                    isActive: formData.isActive
                })
            })

            const data = await response.json()

            if (!response.ok) {
                alert(data.error || "Failed to save collection")
                return
            }

            setShowModal(false)
            router.refresh()
        } catch (error) {
            console.error("Failed to save collection:", error)
            alert("Failed to save collection")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (deleteConfirm !== id) {
            setDeleteConfirm(id)
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`/api/admin/collections/${id}`, {
                method: "DELETE"
            })

            const data = await response.json()

            if (!response.ok) {
                alert(data.error || "Failed to delete collection")
                return
            }

            setDeleteConfirm(null)
            router.refresh()
        } catch (error) {
            console.error("Failed to delete collection:", error)
            alert("Failed to delete collection")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="mb-6">
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-obsidian-800 transition-colors min-h-[48px]"
                    aria-label="Add collection"
                >
                    <Plus className="w-4 h-4" />
                    Add Collection
                </button>
            </div>

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-obsidian-50 border-b border-obsidian-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Name</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Slug</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Products</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-100">
                        {collections.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-obsidian-500">
                                    No collections yet. Create your first collection to get started.
                                </td>
                            </tr>
                        ) : (
                            collections.map((collection) => (
                                <tr key={collection.id} className="hover:bg-obsidian-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-obsidian-900">
                                            {collection.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600 font-mono text-xs">
                                        {collection.slug}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-tabular text-obsidian-900">
                                            {collection._count.products}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {collection.isActive ? (
                                                <>
                                                    <Eye className="w-4 h-4 text-green-600" />
                                                    <span className="text-green-700 bg-green-50 px-2 py-1 rounded-sm text-xs font-medium">
                                                        Active
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <EyeOff className="w-4 h-4 text-obsidian-400" />
                                                    <span className="text-obsidian-600 bg-obsidian-50 px-2 py-1 rounded-sm text-xs font-medium">
                                                        Inactive
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(collection)}
                                                className="text-obsidian-400 hover:text-obsidian-900 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                                disabled={loading}
                                                aria-label={`Edit ${collection.name}`}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(collection.id)}
                                                className={`transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center ${
                                                    deleteConfirm === collection.id
                                                        ? "text-red-600 hover:text-red-700"
                                                        : "text-obsidian-400 hover:text-red-600"
                                                }`}
                                                disabled={loading}
                                                aria-label={deleteConfirm === collection.id ? `Confirm delete ${collection.name}` : `Delete ${collection.name}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-obsidian-200">
                            <h2 className="text-xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                                {editingCollection ? "Edit Collection" : "Create Collection"}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-obsidian-900 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="w-full px-3 py-2 rounded-sm border border-obsidian-300 focus:border-gold-500 focus:ring-gold-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="slug" className="block text-sm font-medium text-obsidian-900 mb-1">
                                    Slug
                                </label>
                                <input
                                    type="text"
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-3 py-2 rounded-sm border border-obsidian-300 focus:border-gold-500 focus:ring-gold-500 font-mono text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-obsidian-900 mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-sm border border-obsidian-300 focus:border-gold-500 focus:ring-gold-500"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded-sm border-obsidian-300 text-gold-500 focus:ring-gold-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-obsidian-900">
                                    Active (visible on storefront)
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-sm border border-obsidian-300 text-obsidian-700 hover:bg-obsidian-50 transition-colors min-h-[48px]"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-sm bg-obsidian-900 text-white hover:bg-obsidian-800 transition-colors min-h-[48px]"
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : editingCollection ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
