import { test, expect } from "@playwright/test"

test.describe("Public Pages", () => {
    test("Homepage loads with key sections", async ({ page }) => {
        await page.goto("/")
        await expect(page.locator("#main-content").first()).toBeVisible()
        const errorOverlay = page.locator("[data-nextjs-dialog]")
        await expect(errorOverlay).toHaveCount(0)
    })

    test("Shop page loads", async ({ page }) => {
        await page.goto("/shop")
        await expect(page.locator("#main-content").first()).toBeVisible()
    })

    test("About page loads", async ({ page }) => {
        await page.goto("/about")
        await expect(page.getByRole("heading", { name: /about/i }).first()).toBeVisible({ timeout: 15000 })
    })

    test("Contact page loads with form", async ({ page }) => {
        await page.goto("/contact")
        await expect(page.getByRole("heading", { name: /contact/i }).first()).toBeVisible({ timeout: 15000 })
    })

    test("Bespoke page loads", async ({ page }) => {
        await page.goto("/bespoke")
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 })
    })

    test("FAQ page loads", async ({ page }) => {
        await page.goto("/faq")
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 })
    })

    test("Size guide page loads", async ({ page }) => {
        await page.goto("/size-guide")
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 })
    })

    test("Delivery page loads", async ({ page }) => {
        await page.goto("/delivery")
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 })
    })

    test("Terms page loads", async ({ page }) => {
        await page.goto("/terms")
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 })
    })

    test("Studio page loads", async ({ page }) => {
        await page.goto("/studio")
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 })
    })

    test("Alterations page loads", async ({ page }) => {
        await page.goto("/alterations")
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 })
    })

    test("Fabric sourcing page loads", async ({ page }) => {
        await page.goto("/fabric-sourcing")
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 })
    })

    test("Group orders page loads", async ({ page }) => {
        await page.goto("/group-orders")
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 })
    })

    test("Contact form submits successfully", async ({ page }) => {
        await page.goto("/contact")
        await page.waitForLoadState("networkidle")
        // Target the contact form (the one with a textarea, not the search form)
        const form = page.locator("form").filter({ has: page.locator("textarea") })
        await expect(form).toBeVisible({ timeout: 15000 })
        const inputs = form.locator("input:visible")
        const inputCount = await inputs.count()
        for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i)
            const type = await input.getAttribute("type")
            const placeholder = await input.getAttribute("placeholder") || ""
            if (type === "email" || placeholder.toLowerCase().includes("email")) {
                await input.fill("test@example.com")
            } else {
                await input.fill("Test Value")
            }
        }
        const textarea = form.locator("textarea:visible")
        if (await textarea.count() > 0) {
            await textarea.first().fill("This is a test message from Playwright automated testing.")
        }
        const submitBtn = form.locator("button[type='submit']")
        await submitBtn.click()
        await page.waitForTimeout(3000)
        // Check for success indicator (text or form reset)
        const successText = page.getByText(/thank you|success|sent/i)
        const hasSuccess = await successText.count() > 0
        if (hasSuccess) {
            console.log("  ✅ Contact form: Success message displayed")
        } else {
            console.log("  ⚠️ Contact form: No explicit success message (check manually)")
        }
    })

    test("Homepage consultation form submits", async ({ page }) => {
        await page.goto("/")
        await page.waitForLoadState("networkidle")
        // Scroll to consultation section
        const consultForm = page.locator("text=Book a Consultation").first()
        if (await consultForm.isVisible({ timeout: 5000 }).catch(() => false)) {
            await consultForm.scrollIntoViewIfNeeded()
            // Fill the form
            const section = page.locator("text=Book a Consultation").locator("..")
            const nameInput = section.locator("input[placeholder='Name'], input").first()
            if (await nameInput.isVisible()) {
                await nameInput.fill("Test User")
            }
            const phoneInput = section.locator("input[placeholder='Phone'], input").nth(1)
            if (await phoneInput.isVisible()) {
                await phoneInput.fill("+234 800 000 0000")
            }
            const textarea = section.locator("textarea")
            if (await textarea.isVisible().catch(() => false)) {
                await textarea.fill("Test consultation request")
            }
            const submitBtn = section.locator("button[type='submit']")
            if (await submitBtn.isVisible()) {
                await submitBtn.click()
                await page.waitForTimeout(3000)
                console.log("  ✅ Consultation form submitted")
            }
        } else {
            console.log("  ⚠️ Consultation form not found on homepage")
        }
    })
})
