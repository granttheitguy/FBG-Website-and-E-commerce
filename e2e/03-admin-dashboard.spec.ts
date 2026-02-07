import { test, expect, type Page } from "@playwright/test"

async function adminLogin(page: Page) {
    await page.goto("/admin/login")
    await page.getByLabel(/email/i).fill("grant@fashionbygrant.com")
    await page.getByLabel(/password/i).fill("Admin@2024")
    await page.locator("button[type='submit']").click()
    await page.waitForURL(/admin\/dashboard/, { timeout: 15000 })
}

test.describe("Admin Dashboard", () => {
    test.beforeEach(async ({ page }) => {
        await adminLogin(page)
    })

    test("Dashboard loads with stats", async ({ page }) => {
        await page.goto("/admin/dashboard")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    // Commerce section
    test("Orders page loads", async ({ page }) => {
        await page.goto("/admin/orders")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.locator("table, [role='table']").first()).toBeVisible({ timeout: 10000 })
    })

    test("Products page loads", async ({ page }) => {
        await page.goto("/admin/products")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.locator("table, [role='table']").first()).toBeVisible({ timeout: 10000 })
    })

    test("Categories page loads", async ({ page }) => {
        await page.goto("/admin/categories")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Collections page loads", async ({ page }) => {
        await page.goto("/admin/collections")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Coupons page loads", async ({ page }) => {
        await page.goto("/admin/coupons")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Inventory page loads", async ({ page }) => {
        await page.goto("/admin/inventory")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Shipping page loads", async ({ page }) => {
        await page.goto("/admin/shipping")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Returns page loads", async ({ page }) => {
        await page.goto("/admin/returns")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Reviews page loads", async ({ page }) => {
        await page.goto("/admin/reviews")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    // Bespoke & Production
    test("Bespoke orders page loads", async ({ page }) => {
        await page.goto("/admin/bespoke")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Production tasks page loads", async ({ page }) => {
        await page.goto("/admin/production")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Fabrics page loads", async ({ page }) => {
        await page.goto("/admin/fabrics")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Suppliers page loads", async ({ page }) => {
        await page.goto("/admin/suppliers")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    // Customers
    test("Customers page loads", async ({ page }) => {
        await page.goto("/admin/customers")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Segments page loads", async ({ page }) => {
        await page.goto("/admin/segments")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    // Content
    test("Newsletter page loads", async ({ page }) => {
        await page.goto("/admin/newsletter")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Consultations page loads", async ({ page }) => {
        await page.goto("/admin/consultations")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Messages page loads", async ({ page }) => {
        await page.goto("/admin/messages")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Tickets page loads", async ({ page }) => {
        await page.goto("/admin/tickets")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Pages (CMS) loads", async ({ page }) => {
        await page.goto("/admin/pages")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    // System
    test("Reports page loads", async ({ page }) => {
        await page.goto("/admin/reports")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Users page loads", async ({ page }) => {
        await page.goto("/admin/users")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Settings page loads", async ({ page }) => {
        await page.goto("/admin/settings")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    // Navigation test
    test("All sidebar nav links are clickable", async ({ page }) => {
        test.setTimeout(60000)
        await page.goto("/admin/dashboard")
        await page.waitForLoadState("networkidle")
        const navLinks = page.locator("nav[aria-label='Admin navigation'] a:visible")
        const count = await navLinks.count()
        const results: { label: string; href: string; status: string }[] = []

        for (let i = 0; i < count; i++) {
            const link = navLinks.nth(i)
            const href = await link.getAttribute("href")
            const label = (await link.textContent())?.trim() || "unknown"
            if (href) {
                const response = await page.request.get(href)
                results.push({
                    label,
                    href,
                    status: response.status() < 400 ? "OK" : `FAIL (${response.status()})`,
                })
            }
        }

        console.log("\n=== ADMIN NAV LINK STATUS ===")
        for (const r of results) {
            console.log(`  ${r.status === "OK" ? "✅" : "❌"} ${r.label} → ${r.href} [${r.status}]`)
        }

        const failures = results.filter((r) => r.status !== "OK")
        expect(failures).toHaveLength(0)
    })

    // Filter tests
    test("Products search filter works", async ({ page }) => {
        await page.goto("/admin/products")
        const searchInput = page.locator("input[type='search'], input[placeholder*='Search']").first()
        if (await searchInput.isVisible()) {
            await searchInput.fill("test product")
            await searchInput.press("Enter")
            await page.waitForTimeout(2000)
            // URL should have search param
            expect(page.url()).toContain("q=")
        }
    })

    test("Orders filter works", async ({ page }) => {
        await page.goto("/admin/orders")
        const statusSelect = page.locator("select").first()
        if (await statusSelect.isVisible()) {
            await statusSelect.selectOption({ index: 1 })
            await page.waitForTimeout(2000)
            expect(page.url()).toContain("status=")
        }
    })
})
