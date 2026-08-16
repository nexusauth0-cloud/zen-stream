import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cssPath = resolve(__dirname, "index.css");
const tokensPath = resolve(__dirname, "tokens.css");
const basePath = resolve(__dirname, "base.css");

/**
 * Regression guard: the global stylesheet must actually import the token and
 * base layers. Without these imports the browser loads an empty layer
 * declaration and every `var(--zs-*)` resolves to nothing — the app renders
 * as unstyled HTML even though component CSS loads fine.
 */
describe("styles/index.css entry", () => {
  it("imports tokens.css and base.css", () => {
    const source = readFileSync(cssPath, "utf8");

    expect(source).toContain('@import "./tokens.css";');
    expect(source).toContain('@import "./base.css";');
  });

  it("declares the cascade-layer order", () => {
    const source = readFileSync(cssPath, "utf8");

    expect(source).toMatch(/@layer\s+reset,\s*tokens,\s*base,\s*components\s*;/);
  });

  it("keeps the referenced layer files present", () => {
    expect(readFileSync(tokensPath, "utf8")).toContain(":root");
    expect(readFileSync(basePath, "utf8")).toContain("@layer base");
  });
});