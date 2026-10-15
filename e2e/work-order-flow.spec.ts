import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

test("owner creates an asset and completes a work order", async ({ page }) => {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const email = `e2e-${stamp}@example.com`;
  const assetName = `e2e-asset-${stamp}`;
  const woTitle = `e2e-wo-${stamp}`;

  await page.goto("/sign-up");
  await page.getByLabel("Name").fill(`e2e-user-${stamp}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("e2e-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).not.toHaveURL(/sign-up/);

  // New sign-ups are viewers; promote through the same script operators use.
  execFileSync(process.execPath, ["scripts/set-role.ts", email, "owner"], {
    stdio: "ignore",
  });

  await page.goto("/assets/new");
  await page.getByLabel("Name").fill(assetName);
  await page.getByLabel("Type").fill("e2e-type");
  await page.getByLabel("Location").fill("e2e-location");
  await page.getByRole("button", { name: "Create asset" }).click();
  await expect(page).toHaveURL(/\/assets$/);
  await page.getByRole("link", { name: assetName }).click();

  await page.getByRole("link", { name: "New work order" }).click();
  await page.getByLabel("Title").fill(woTitle);
  await page.getByRole("button", { name: "Create work order" }).click();
  await expect(page.getByRole("heading", { name: woTitle })).toBeVisible();

  const history = page.getByRole("listitem").filter({ hasText: "→" });
  await expect(history).toHaveCount(1);

  await page.getByRole("button", { name: "Move to in progress" }).click();
  await expect(history).toHaveCount(2);

  await page.getByRole("button", { name: "Move to done" }).click();
  await expect(history).toHaveCount(3);

  await expect(page.getByRole("button", { name: /^Move to/ })).toHaveCount(0);
});
