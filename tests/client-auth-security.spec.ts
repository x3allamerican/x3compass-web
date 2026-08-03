import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("client identity is not trusted from raw local storage", async () => {
  const source = await readFile("src/lib/useUser.ts", "utf8");
  expect(source).not.toContain("localStorage.getItem");
  expect(source).not.toContain("readCachedUser");
  expect(source).not.toMatch(/sb-[a-z0-9-]+-auth-token/);
});

test("control center uses the validated super-admin hook", async () => {
  const source = await readFile("src/app/app/control-center/page.tsx", "utf8");
  expect(source).toContain('import { useIsSuperAdmin } from "@/lib/superAdmin"');
  expect(source).toContain("const isSuperAdmin = useIsSuperAdmin()");
  expect(source).not.toContain("const SUPER_ADMIN_EMAILS");
});
