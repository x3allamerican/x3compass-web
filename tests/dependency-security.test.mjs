import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lock = JSON.parse(
  await readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
);

function versionAtLeast(actual, minimum) {
  const actualParts = actual.split(".").map(Number);
  const minimumParts = minimum.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (actualParts[index] > minimumParts[index]) return true;
    if (actualParts[index] < minimumParts[index]) return false;
  }

  return true;
}

test("production dependency lock excludes the remediated Next.js and Sharp ranges", () => {
  const nextVersion = lock.packages["node_modules/next"]?.version;
  const sharpVersion = lock.packages["node_modules/sharp"]?.version;

  assert.ok(nextVersion, "Next.js must be present in the dependency lock");
  assert.ok(sharpVersion, "Sharp must be present in the dependency lock");
  assert.ok(
    versionAtLeast(nextVersion, "16.3.0"),
    `Next.js ${nextVersion} is below the remediated 16.3.0 release`,
  );
  assert.ok(
    versionAtLeast(sharpVersion, "0.35.0"),
    `Sharp ${sharpVersion} is below the remediated 0.35.0 release`,
  );
});
