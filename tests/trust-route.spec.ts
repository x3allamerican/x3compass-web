import { expect, test } from "@playwright/test";

test("trust route presents the X3 security and decision-support commitments", async ({ page }) => {
  const response = await page.goto("/trust");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Trust & Security" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Data protection" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "AI, honestly" })).toBeVisible();
  await expect(page.getByText("Not legal advice · Not an FMCSA determination.")).toBeVisible();
  const trustContent = page.locator("article");
  await expect(trustContent.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  await expect(trustContent.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
});
