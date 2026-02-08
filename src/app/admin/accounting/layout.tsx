import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AccountingTabs } from "./_components/accounting-tabs"
import { DateRangePicker } from "./_components/date-range-picker"
import { ExportMenu } from "./_components/export-menu"

export const revalidate = 60

export default async function AccountingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/admin/login")
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-obsidian-900 font-serif tracking-[-0.02em]">
          Accounting
        </h1>
        <p className="text-obsidian-500 mt-1 text-sm">
          Financial analytics and revenue insights
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <AccountingTabs />
        <div className="flex items-center gap-3">
          <DateRangePicker />
          <ExportMenu />
        </div>
      </div>

      {children}
    </div>
  )
}
