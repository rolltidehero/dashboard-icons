import { expect, test } from "@playwright/test"

test.describe("External icon source filter", () => {
	test("'All sources' shows both native and external icons", async ({ page }) => {
		await page.goto("/icons")
		const nativeCard = page.locator('a[href^="/icons/"]:not([href^="/icons/external/"])').first()
		const externalCard = page.locator('a[href^="/icons/external/"]').first()
		await expect(nativeCard).toBeVisible()
		await expect(externalCard).toBeVisible()
	})

	test("native filter excludes external icons", async ({ page }) => {
		await page.goto("/icons?source=native")
		await expect(page.getByRole("button", { name: /dashboard icons/i })).toBeVisible()

		const nativeCard = page.locator('a[href^="/icons/"]:not([href^="/icons/external/"])').first()
		await expect(nativeCard).toBeVisible()

		const externalCards = page.locator('a[href^="/icons/external/"]')
		await expect(externalCards).toHaveCount(0)
	})

	test("filter button shows source icon when a source is selected", async ({ page }) => {
		await page.goto("/icons?source=selfhst")
		const filterButton = page.getByRole("button", { name: /selfh\.st/i })
		await expect(filterButton).toBeVisible()
		await expect(filterButton.locator("img")).toBeVisible()
	})
})

test.describe("External selfh.st icons", () => {
	test("source filter narrows browse results to selfh.st", async ({ page }) => {
		await page.goto("/icons?source=selfhst")
		await expect(page.getByRole("button", { name: /selfh\.st/i })).toBeVisible()

		const firstExternalCard = page.locator('a[href^="/icons/external/"]').first()
		await expect(firstExternalCard).toBeVisible()
	})

	test("detail page renders attribution and jsDelivr assets", async ({ page }) => {
		await page.goto("/icons/external/2fauth")

		await expect(page.getByRole("heading", { name: /2fauth/i })).toBeVisible()
		await expect(page.getByText("Icons by selfh.st/icons (CC BY 4.0)")).toBeVisible()
		await expect(page.getByRole("link", { name: /view on selfh\.st/i })).toBeVisible()

		const jsDelivrImages = page.locator('img[src*="cdn.jsdelivr.net/gh/selfhst/icons"]')
		await expect(jsDelivrImages.first()).toBeVisible()
	})

	test("detail page shows themed PNG variants when available", async ({ page }) => {
		await page.goto("/icons/external/altcha")

		const lightImages = page.locator('img[src*="altcha-light"]')
		const darkImages = page.locator('img[src*="altcha-dark"]')
		const hasLight = (await lightImages.count()) > 0
		const hasDark = (await darkImages.count()) > 0
		expect(hasLight || hasDark).toBe(true)
	})
})

test.describe("External LobeHub icons", () => {
	test("source filter narrows browse results to LobeHub", async ({ page }) => {
		await page.goto("/icons?source=lobehub")
		await expect(page.getByRole("button", { name: /lobehub/i })).toBeVisible()

		const firstExternalCard = page.locator('a[href^="/icons/external/"]').first()
		await expect(firstExternalCard).toBeVisible()
	})

	test("detail page renders attribution and jsDelivr assets", async ({ page }) => {
		await page.goto("/icons/external/openai-color")

		await expect(page.getByRole("heading", { name: /openai/i })).toBeVisible()
		await expect(page.getByText(/MIT/)).toBeVisible()
		await expect(page.getByRole("link", { name: /view on lobehub/i })).toBeVisible()

		const jsDelivrImages = page.locator('img[src*="cdn.jsdelivr.net/npm/@lobehub"]')
		await expect(jsDelivrImages.first()).toBeVisible()
	})

	test("'View on LobeHub' links to the correct brand page", async ({ page }) => {
		await page.goto("/icons/external/openai-color")

		const viewLink = page.getByRole("link", { name: /view on lobehub/i })
		await expect(viewLink).toHaveAttribute("href", /lobehub\.com\/icons\/openai/)
	})

	test("color variant is the primary entry, not duplicated with monochrome", async ({ page }) => {
		await page.goto("/icons?source=lobehub")

		await page.waitForSelector('a[href^="/icons/external/"]')
		const allCards = page.locator('a[href^="/icons/external/"]')
		const hrefs = await allCards.evaluateAll((els) => els.map((el) => el.getAttribute("href")))

		const openaiCards = hrefs.filter((h) => h?.includes("openai"))
		const hasColor = openaiCards.some((h) => h?.includes("openai-color"))
		expect(hasColor).toBe(true)

		const hasBareOpenai = openaiCards.some((h) => h === "/icons/external/openai")
		expect(hasBareOpenai).toBe(false)
	})

	test("detail page does not show SVG light/dark variants (only PNG/WebP have them)", async ({ page }) => {
		await page.goto("/icons/external/openai-color")

		const svgLightImages = page.locator('img[src*="openai-color-light.svg"]')
		const svgDarkImages = page.locator('img[src*="openai-color-dark.svg"]')
		await expect(svgLightImages).toHaveCount(0)
		await expect(svgDarkImages).toHaveCount(0)
	})
})

test.describe("External icon card hover behavior", () => {
	test("source badge appears on hover for external icons", async ({ page }) => {
		await page.goto("/icons?source=lobehub")

		const firstCard = page.locator(".group\\/card").first()
		await expect(firstCard).toBeVisible()

		const badge = firstCard.locator("text=from LobeHub")
		await firstCard.hover()
		await expect(badge).toBeVisible()
	})

	test("native icons do not show source badge on hover", async ({ page }) => {
		await page.goto("/icons?source=native")

		const firstCard = page.locator(".group\\/card").first()
		await expect(firstCard).toBeVisible()

		await firstCard.hover()
		const badge = firstCard.locator("text=from")
		await expect(badge).toHaveCount(0)
	})
})
