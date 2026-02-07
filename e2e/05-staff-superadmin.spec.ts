import { test, expect, type Page } from "@playwright/test"

async function staffLogin(page: Page) {
    await page.goto("/staff/login")
    await page.getByLabel(/email/i).fill("staff@fashionbygrant.com")
    await page.getByLabel(/password/i).fill("Staff@2024")
    await page.locator("button[type='submit']").click()
    await page.waitForURL(/staff\/dashboard/, { timeout: 15000 })
}

async function superAdminLogin(page: Page) {
    await page.goto("/super-admin/login")
    await page.getByLabel(/email/i).fill("admin@fashionbygrant.com")
    await page.getByLabel(/password/i).fill("SuperAdmin@2024")
    await page.locator("button[type='submit']").click()
    await page.waitForURL(/super-admin\/dashboard/, { timeout: 15000 })
}

test.describe("Staff Dashboard", () => {
    test.beforeEach(async ({ page }) => {
        await staffLogin(page)
    })

    test("Staff dashboard loads", async ({ page }) => {
        await page.goto("/staff/dashboard")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Staff orders page loads", async ({ page }) => {
        await page.goto("/staff/orders")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Staff bespoke page loads", async ({ page }) => {
        await page.goto("/staff/bespoke")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Staff tasks page loads", async ({ page }) => {
        await page.goto("/staff/tasks")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Staff customers page loads", async ({ page }) => {
        await page.goto("/staff/customers")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Staff interactions page loads", async ({ page }) => {
        await page.goto("/staff/interactions")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })
})

test.describe("Super Admin Dashboard", () => {
    test.beforeEach(async ({ page }) => {
        await superAdminLogin(page)
    })

    test("Super admin dashboard loads", async ({ page }) => {
        await page.goto("/super-admin/dashboard")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Super admin users page loads", async ({ page }) => {
        await page.goto("/super-admin/users")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Super admin activity logs page loads", async ({ page }) => {
        await page.goto("/super-admin/activity-logs")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Super admin reports page loads", async ({ page }) => {
        await page.goto("/super-admin/reports")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Super admin settings page loads", async ({ page }) => {
        await page.goto("/super-admin/settings")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Super admin SMTP settings loads", async ({ page }) => {
        await page.goto("/super-admin/settings/smtp")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Super admin email templates loads", async ({ page }) => {
        await page.goto("/super-admin/settings/templates")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Super admin email logs loads", async ({ page }) => {
        await page.goto("/super-admin/settings/email-logs")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    // Nav test
    test("All super admin nav links work", async ({ page }) => {
        test.setTimeout(60000)
        await page.goto("/super-admin/dashboard")
        await page.waitForLoadState("networkidle")
        const navLinks = page.locator("aside a:visible, nav a:visible")
        const count = await navLinks.count()
        const results: { label: string; href: string; status: string }[] = []

        for (let i = 0; i < count; i++) {
            const link = navLinks.nth(i)
            const href = await link.getAttribute("href")
            const label = (await link.textContent())?.trim() || "unknown"
            if (href && href.startsWith("/super-admin")) {
                const response = await page.request.get(href)
                results.push({
                    label,
                    href,
                    status: response.status() < 400 ? "OK" : `FAIL (${response.status()})`,
                })
            }
        }

        console.log("\n=== SUPER ADMIN NAV LINK STATUS ===")
        for (const r of results) {
            console.log(`  ${r.status === "OK" ? "✅" : "❌"} ${r.label} → ${r.href} [${r.status}]`)
        }

        const failures = results.filter((r) => r.status !== "OK")
        expect(failures).toHaveLength(0)
    })
})
