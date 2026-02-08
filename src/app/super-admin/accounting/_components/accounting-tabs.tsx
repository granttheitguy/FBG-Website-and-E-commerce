"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tab {
  label: string
  href: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS: Tab[] = [
  { label: "Overview", href: "/super-admin/accounting/overview" },
  { label: "Revenue", href: "/super-admin/accounting/revenue" },
  { label: "Sales", href: "/super-admin/accounting/sales" },
  { label: "Financial", href: "/super-admin/accounting/financial" },
  { label: "Customers", href: "/super-admin/accounting/customers" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AccountingTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Accounting sections"
      className="overflow-x-auto scrollbar-none"
    >
      <div className="flex flex-row gap-1">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                inline-flex min-h-[48px] items-center whitespace-nowrap
                border-b-2 px-4 py-3 text-sm font-medium transition-colors
                ${
                  isActive
                    ? "border-blue-600 text-blue-900"
                    : "border-transparent text-obsidian-500 hover:text-obsidian-700"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
