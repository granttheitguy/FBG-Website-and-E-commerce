import { prisma } from "@/lib/db"
import { Plus, Search, Shield } from "lucide-react"
import { UserFormDialog } from "./_components/user-form-dialog"
import { UserActionsMenu } from "./_components/user-actions-menu"
import { Button } from "@/components/ui/button"

export default async function SuperAdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; role?: string }>
}) {
    const { q, role } = await searchParams

    const where: any = {}

    if (q) {
        where.OR = [
            { name: { contains: q } },
            { email: { contains: q } },
        ]
    }

    if (role) {
        where.role = role
    }

    const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            _count: { select: { orders: true } }
        }
    })

    return (
        <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-medium text-obsidian-900">User Management</h1>
                        <p className="text-sm text-obsidian-500 mt-1">Manage all system users including Admins and Staff.</p>
                    </div>
                    <div className="flex gap-2">
                        <UserFormDialog mode="create" role="ADMIN">
                            <Button className="flex items-center gap-2 bg-obsidian-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-obsidian-800 transition-colors">
                                <Plus className="w-4 h-4" />
                                Create Admin
                            </Button>
                        </UserFormDialog>
                        <UserFormDialog mode="create" role="STAFF">
                            <Button variant="outline" className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors">
                                <Plus className="w-4 h-4" />
                                Create Staff
                            </Button>
                        </UserFormDialog>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-sm border border-obsidian-200 shadow-sm mb-6 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
                        <form>
                            <input
                                name="q"
                                type="text"
                                defaultValue={q}
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2 rounded-sm border border-obsidian-300 text-sm focus:border-obsidian-900 focus:ring-obsidian-900"
                            />
                        </form>
                    </div>
                    <form>
                        <select
                            name="role"
                            defaultValue={role}
                            className="rounded-sm border border-obsidian-300 text-sm focus:border-obsidian-900 focus:ring-obsidian-900 px-4 py-2"
                        >
                            <option value="">All Roles</option>
                            <option value="CUSTOMER">Customer</option>
                            <option value="STAFF">Staff</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                        <Button type="submit" variant="outline" className="ml-2">Filter</Button>
                    </form>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">User</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Role</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Orders</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Joined</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-obsidian-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-obsidian-100 flex items-center justify-center text-obsidian-500 font-medium text-xs">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-obsidian-900">{user.name}</p>
                                                <p className="text-xs text-obsidian-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                user.role === 'STAFF' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-obsidian-50 text-obsidian-700 border-obsidian-100'
                                            }`}>
                                            {user.role === 'SUPER_ADMIN' && <Shield className="w-3 h-3" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600">
                                        {user._count.orders}
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <UserActionsMenu user={user as any} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
    )
}

