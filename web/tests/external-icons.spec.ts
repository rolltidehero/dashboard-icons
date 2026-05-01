import { expect, test } from "@playwright/test"

test.describe("External selfh.st icons", () => {
	test("source filter narrows browse results to selfh.st", async ({ page }) => {
		await page.goto("/icons?source=selfhst")
		await expect(page.getByRole("button", { name: /selfh\.st/i })).toBeVisible()
		await expect(page.getByText("selfh.st").first()).toBeVisible()

		const firstExternalCard = page.locator('a[href^="/icons/external/"]').first()
		await expect(firstExternalCard).toBeVisible()
	})

	test("native source filter keeps native detail links", async ({ page }) => {
		await page.goto("/icons?source=native")
		await expect(page.getByRole("button", { name: /dashboard icons/i })).toBeVisible()

		const firstNativeCard = page.locator('a[href^="/icons/"]').filter({ hasNot: page.locator('a[href^="/icons/external/"]') }).first()
		await expect(firstNativeCard).toBeVisible()
		await expect(firstNativeCard).not.toHaveAttribute("href", /\/icons\/external\//)
	})

	test("external detail page renders attribution and jsDelivr assets", async ({ page }) => {
		await page.goto("/icons/external/2fauth")

		await expect(page.getByRole("heading", { name: /2fauth/i })).toBeVisible()
		await expect(page.getByText("Icons by selfh.st/icons (CC BY 4.0)")).toBeVisible()
		await expect(page.getByRole("link", { name: /view on selfh\.st/i })).toBeVisible()

		const jsDelivrImages = page.locator('img[src^="https://cdn.jsdelivr.net/gh/selfhst/icons/"]')
		await expect(jsDelivrImages.first()).toBeVisible()

		const imageSrcs = await jsDelivrImages.evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src))
		expect(imageSrcs.some((src) => src.includes("/svg/2fauth.svg"))).toBe(true)
	})
})
