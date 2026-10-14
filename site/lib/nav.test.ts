import { describe, expect, it } from "vitest";
import { isActive } from "./nav";

describe("isActive", () => {
  it("matches Home only on the home page", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/", "/towns")).toBe(false);
  });

  it("matches a tab and the pages inside it", () => {
    expect(isActive("/towns", "/towns")).toBe(true);
    expect(isActive("/towns", "/towns/ridgewood")).toBe(true);
  });

  it("does not match a different page that starts with the same letters", () => {
    expect(isActive("/check", "/checklist")).toBe(false);
  });
});
