import { test, expect } from "@playwright/test"

test.describe("Authentication Pages", () => {
    test("Customer login page loads with form", async ({ page }) => {
        await page.goto("/login")
        await expect(page.locator("form").first()).toBeVisible()
    })

    test("Signup page loads with form", async ({ page }) => {
        await page.goto("/signup")
        await expect(page.locator("form").first()).toBeVisible()
    })

    test("Forgot password page loads", async ({ page }) => {
        await page.goto("/forgot-password")
        await expect(page.locator("form").first()).toBeVisible()
    })

    test("Admin login page loads", async ({ page }) => {
        await page.goto("/admin/login")
        await expect(page.locator("form").first()).toBeVisible()
    })

    test("Staff login page loads", async ({ page }) => {
        await page.goto("/staff/login")
        await expect(page.locator("form").first()).toBeVisible()
    })

    test("Super admin login page loads", async ({ page }) => {
        await page.goto("/super-admin/login")
        await expect(page.locator("form").first()).toBeVisible()
    })

    test("Customer can log in", async ({ page }) => {
        await page.goto("/login")
        await page.getByLabel(/email/i).fill("customer@fashionbygrant.com")
        await page.getByLabel(/password/i).fill("Customer@2024")
        await page.locator("button[type='submit']").click()
        await page.waitForURL(/account/, { timeout: 15000 })
        expect(page.url()).toContain("/account")
        console.log("  ✅ Customer login successful → redirected to", page.url())
    })

    test("Admin can log in", async ({ page }) => {
        await page.goto("/admin/login")
        await page.getByLabel(/email/i).fill("grant@fashionbygrant.com")
        await page.getByLabel(/password/i).fill("Admin@2024")
        await page.locator("button[type='submit']").click()
        await page.waitForURL(/admin\/dashboard/, { timeout: 15000 })
        expect(page.url()).toContain("/admin")
        console.log("  ✅ Admin login successful → redirected to", page.url())
    })

    test("Staff can log in", async ({ page }) => {
        await page.goto("/staff/login")
        await page.getByLabel(/email/i).fill("staff@fashionbygrant.com")
        await page.getByLabel(/password/i).fill("Staff@2024")
        await page.locator("button[type='submit']").click()
        await page.waitForURL(/staff\/dashboard/, { timeout: 15000 })
        expect(page.url()).toContain("/staff")
        console.log("  ✅ Staff login successful → redirected to", page.url())
    })

    test("Super Admin can log in", async ({ page }) => {
        await page.goto("/super-admin/login")
        await page.getByLabel(/email/i).fill("admin@fashionbygrant.com")
        await page.getByLabel(/password/i).fill("SuperAdmin@2024")
        await page.locator("button[type='submit']").click()
        await page.waitForURL(/super-admin\/dashboard/, { timeout: 15000 })
        expect(page.url()).toContain("/super-admin")
        console.log("  ✅ Super Admin login successful → redirected to", page.url())
    })
})
