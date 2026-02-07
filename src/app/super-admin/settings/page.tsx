import Link from "next/link"
import { Mail, FileText, List, Shield, Bell, Database, Server } from "lucide-react"

export default function SettingsPage() {
    const settingsSections = [
        {
            icon: Mail,
            title: "SMTP Settings",
            description: "Configure email server settings",
            href: "/super-admin/settings/smtp",
            color: "blue"
        },
        {
            icon: FileText,
            title: "Email Templates",
            description: "Manage email templates",
            href: "/super-admin/settings/templates",
            color: "green"
        },
        {
            icon: List,
            title: "Email Logs",
            description: "View sent email history",
            href: "/super-admin/settings/email-logs",
            color: "purple"
        },
        {
            icon: Shield,
            title: "Security Settings",
            description: "Configure security and authentication",
            href: "#",
            color: "red",
            comingSoon: true
        },
        {
            icon: Bell,
            title: "Notifications",
            description: "Manage system notifications",
            href: "#",
            color: "amber",
            comingSoon: true
        },
        {
            icon: Database,
            title: "Database",
            description: "Database backup and restore",
            href: "#",
            color: "indigo",
            comingSoon: true
        }
    ]

    const colorClasses: Record<string, { bg: string; icon: string; hover: string }> = {
        blue: { bg: "bg-blue-50", icon: "text-blue-600", hover: "hover:border-blue-200" },
        green: { bg: "bg-green-50", icon: "text-green-600", hover: "hover:border-green-200" },
        purple: { bg: "bg-purple-50", icon: "text-purple-600", hover: "hover:border-purple-200" },
        red: { bg: "bg-red-50", icon: "text-red-600", hover: "hover:border-red-200" },
        amber: { bg: "bg-amber-50", icon: "text-amber-600", hover: "hover:border-amber-200" },
        indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", hover: "hover:border-indigo-200" }
    }

    return (
        <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-obsidian-900">Settings</h1>
                    <p className="text-obsidian-500 mt-1">Manage system configuration and preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settingsSections.map((section) => {
                        const Icon = section.icon
                        const colors = colorClasses[section.color]
                        const Component = section.comingSoon ? "div" : Link

                        return (
                            <Component
                                key={section.title}
                                href={section.href}
                                className={`bg-white rounded-xl border border-obsidian-200 p-6 shadow-sm transition-all ${section.comingSoon
                                        ? "opacity-60 cursor-not-allowed"
                                        : `${colors.hover} hover:shadow-md cursor-pointer`
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-sm ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-obsidian-900 mb-1">
                                            {section.title}
                                            {section.comingSoon && (
                                                <span className="ml-2 text-xs font-normal text-obsidian-400 bg-obsidian-100 px-2 py-0.5 rounded">
                                                    Coming Soon
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-obsidian-500">{section.description}</p>
                                    </div>
                                </div>
                            </Component>
                        )
                    })}
                </div>

                {/* System Info */}
                <div className="mt-8 bg-white rounded-xl border border-obsidian-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Server className="w-5 h-5 text-obsidian-600" />
                        <h3 className="text-lg font-semibold text-obsidian-900">System Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide mb-1">Platform Version</p>
                            <p className="text-sm font-mono text-obsidian-900">1.0.0</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide mb-1">Database</p>
                            <p className="text-sm font-mono text-obsidian-900">SQLite</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide mb-1">Environment</p>
                            <p className="text-sm font-mono text-obsidian-900">{process.env.NODE_ENV || "production"}</p>
                        </div>
                    </div>
                </div>
            </div>
    )
}
