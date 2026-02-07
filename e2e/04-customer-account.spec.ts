import { test, expect, type Page } from "@playwright/test"

async function customerLogin(page: Page) {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("customer@fashionbygrant.com")
    await page.getByLabel(/password/i).fill("Customer@2024")
    await page.locator("button[type='submit']").click()
    await page.waitForURL(/account\/dashboard/, { timeout: 15000 })
}

test.describe("Customer Account", () => {
    test.beforeEach(async ({ page }) => {
        await customerLogin(page)
    })

    test("Account dashboard loads", async ({ page }) => {
        await page.goto("/account/dashboard")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Orders page loads", async ({ page }) => {
        await page.goto("/account/orders")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Profile page loads with form", async ({ page }) => {
        await page.goto("/account/profile")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Addresses page loads", async ({ page }) => {
        await page.goto("/account/addresses")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Wishlist page loads", async ({ page }) => {
        await page.goto("/account/wishlist")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Reviews page loads", async ({ page }) => {
        await page.goto("/account/reviews")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Measurements page loads", async ({ page }) => {
        await page.goto("/account/measurements")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Notifications page loads", async ({ page }) => {
        await page.goto("/account/notifications")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Support tickets page loads", async ({ page }) => {
        await page.goto("/account/tickets")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    test("Returns page loads", async ({ page }) => {
        await page.goto("/account/returns")
        await expect(page).not.toHaveURL(/login/)
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 })
    })

    // Navigation test
    test("All account nav links work", async ({ page }) => {
        await page.goto("/account/dashboard")
        const navLinks = page.locator("aside nav a, aside a")
        const count = await navLinks.count()
        const results: { label: string; href: string; status: string }[] = []

        for (let i = 0; i < count; i++) {
            const link = navLinks.nth(i)
            const href = await link.getAttribute("href")
            const label = (await link.textContent())?.trim() || "unknown"
            if (href && href.startsWith("/account")) {
                const response = await page.request.get(href)
                results.push({
                    label,
                    href,
                    status: response.status() < 400 ? "OK" : `FAIL (${response.status()})`,
                })
            }
        }

        console.log("\n=== ACCOUNT NAV LINK STATUS ===")
        for (const r of results) {
            console.log(`  ${r.status === "OK" ? "✅" : "❌"} ${r.label} → ${r.href} [${r.status}]`)
        }

        const failures = results.filter((r) => r.status !== "OK")
        expect(failures).toHaveLength(0)
    })
})
