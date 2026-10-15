// Captures docs/screenshots/*.png. Needs the app running (npm run dev) and a
// reachable database. Creates a throwaway owner plus sample data through the UI.
// Not part of the test suite. Usage: npm run screenshots
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium, type BrowserContext, type Page } from "@playwright/test";

const baseURL =
  process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`;
const outDir = "docs/screenshots";
const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

async function seed(page: Page): Promise<{ assetUrl: string; woUrl: string }> {
  const stamp = Date.now();
  const email = `shots-${stamp}@example.com`;

  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Dana Reyes");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("screenshots-pass-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-up"));

  execFileSync(process.execPath, ["scripts/set-role.ts", email, "owner"], {
    stdio: "ignore",
  });

  await page.goto("/assets/new");
  await page.getByLabel("Name").fill(`CNC Mill #${stamp % 1000}`);
  await page.getByLabel("Type").fill("CNC");
  await page.getByLabel("Location").fill("Bay A");
  await page.getByLabel("Serial").fill(`SN-${stamp}`);
  await page.getByRole("button", { name: "Create asset" }).click();
  await page.waitForURL(/\/assets$/);
  await page.getByRole("link", { name: `CNC Mill #${stamp % 1000}` }).click();
  await page.waitForURL(/\/assets\/[0-9a-f-]{36}$/);
  const assetUrl = page.url();

  const orders = [
    { title: "Spindle bearing noise", priority: "High", start: false },
    { title: "Coolant pump leaking", priority: "High", start: false },
    { title: "Replace air filter", priority: "Medium", start: true },
  ];
  let woUrl = assetUrl;
  for (const o of orders) {
    await page.goto(`${assetUrl}/work-orders/new`);
    await page.getByLabel("Title").fill(o.title);
    await page
      .getByLabel("Description")
      .fill("Reported by the second shift. Check before the next run.");
    await page.getByLabel("Priority").selectOption({ label: o.priority });
    await page.getByRole("button", { name: "Create work order" }).click();
    await page.waitForURL(/\/work-orders\/[0-9a-f-]{36}$/);
    if (o.start) {
      await page.getByLabel("Note (optional)").fill("Parts on the bench");
      await page.getByRole("button", { name: "Move to in progress" }).click();
      await page.getByRole("button", { name: "Move to done" }).waitFor();
      woUrl = page.url();
    }
  }
  return { assetUrl, woUrl };
}

async function shoot(
  context: BrowserContext,
  name: string,
  path: string,
  file: string,
): Promise<void> {
  const page = await context.newPage();
  await page.goto(path);
  await page.getByRole("heading").first().waitFor();
  await page.waitForLoadState("networkidle");
  // Grow the viewport to the full page so fixed bars (tab bar) sit at the bottom.
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  await page.setViewportSize({
    width: page.viewportSize()?.width ?? 1280,
    height,
  });
  await page.screenshot({ path: `${outDir}/${file}` });
  await page.close();
  console.log(`${name}: ${outDir}/${file}`);
}

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    const setup = await browser.newContext({ baseURL });
    const setupPage = await setup.newPage();
    const { assetUrl, woUrl } = await seed(setupPage);
    const storageState = await setup.storageState();
    await setup.close();

    const rel = (u: string) => new URL(u).pathname;
    for (const vp of viewports) {
      const context = await browser.newContext({
        baseURL,
        storageState,
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      await shoot(context, vp.name, "/", `home-${vp.name}.png`);
      await shoot(context, vp.name, rel(assetUrl), `asset-${vp.name}.png`);
      await shoot(context, vp.name, rel(woUrl), `work-order-${vp.name}.png`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
