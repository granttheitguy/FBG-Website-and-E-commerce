"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, FolderTree } from "lucide-react"

interface Category {
    id: string
    name: string
    slug: string
    parentId: string | null
    description: string | null
    createdAt: string
    updatedAt: string
    parent?: { id: string; name: string } | null
    _count: {
        products: number
    }
}

interface CategoriesClientProps {
    initialCategories: Category[]
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>(initialCategories)
    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [loading, setLoading] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        parentId: "",
        description: ""
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
            slug: editingCategory ? formData.slug : generateSlug(value)
        })
    }

    const openCreateModal = () => {
        setEditingCategory(null)
        setFormData({ name: "", slug: "", parentId: "", description: "" })
        setShowModal(true)
    }

    const openEditModal = (category: Category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            slug: category.slug,
            parentId: category.parentId || "",
            description: category.description || ""
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = editingCategory
                ? `/api/admin/categories/${editingCategory.id}`
                : "/api/admin/categories"

            const method = editingCategory ? "PATCH" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    slug: formData.slug,
                    parentId: formData.parentId || undefined,
                    description: formData.description || undefined
                })
            })

            const data = await response.json()

            if (!response.ok) {
                alert(data.error || "Failed to save category")
                return
            }

            setShowModal(false)
            router.refresh()
        } catch (error) {
            console.error("Failed to save category:", error)
            alert("Failed to save category")
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
            const response = await fetch(`/api/admin/categories/${id}`, {
                method: "DELETE"
            })

            const data = await response.json()

            if (!response.ok) {
                alert(data.error || "Failed to delete category")
                return
            }

            setDeleteConfirm(null)
            router.refresh()
        } catch (error) {
            console.error("Failed to delete category:", error)
            alert("Failed to delete category")
        } finally {
            setLoading(false)
        }
    }

    // Get top-level categories for parent select (excluding current category when editing)
    const availableParents = categories.filter(
        cat => !cat.parentId && (!editingCategory || cat.id !== editingCategory.id)
    )

    return (
        <>
            <div className="mb-6">
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-obsidian-800 transition-colors min-h-[48px]"
                    aria-label="Add category"
                >
                    <Plus className="w-4 h-4" />
                    Add Category
                </button>
            </div>

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-obsidian-50 border-b border-obsidian-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Name</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Slug</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Parent</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Products</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-100">
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-obsidian-500">
                                    No categories yet. Create your first category to get started.
                                </td>
                            </tr>
                        ) : (
                            categories.map((category) => (
                                <tr key={category.id} className="hover:bg-obsidian-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {!category.parentId && (
                                                <FolderTree className="w-4 h-4 text-gold-500" />
                                            )}
                                            <span className="font-medium text-obsidian-900">
                                                {category.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600 font-mono text-xs">
                                        {category.slug}
                                    </td>
                                    <td className="px-6 py-4">
                                        {category.parent ? (
                                            <span className="text-obsidian-600 text-xs bg-obsidian-50 px-2 py-1 rounded-sm">
                                                {category.parent.name}
                                            </span>
                                        ) : (
                                            <span className="text-obsidian-400 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-tabular text-obsidian-900">
                                            {category._count.products}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(category)}
                                                className="text-obsidian-400 hover:text-obsidian-900 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                                disabled={loading}
                                                aria-label={`Edit ${category.name}`}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className={`transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center ${
                                                    deleteConfirm === category.id
                                                        ? "text-red-600 hover:text-red-700"
                                                        : "text-obsidian-400 hover:text-red-600"
                                                }`}
                                                disabled={loading}
                                                aria-label={deleteConfirm === category.id ? `Confirm delete ${category.name}` : `Delete ${category.name}`}
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
                                {editingCategory ? "Edit Category" : "Create Category"}
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
                                <label htmlFor="parentId" className="block text-sm font-medium text-obsidian-900 mb-1">
                                    Parent Category (Optional)
                                </label>
                                <select
                                    id="parentId"
                                    value={formData.parentId}
                                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-sm border border-obsidian-300 focus:border-gold-500 focus:ring-gold-500"
                                >
                                    <option value="">None (Top Level)</option>
                                    {availableParents.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
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
                                    {loading ? "Saving..." : editingCategory ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
