// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const { Header } = await import("./Header");

afterEach(cleanup);

function desktopNav() {
  // The first "Main" nav is the desktop tab bar; the second is the mobile menu.
  return within(screen.getAllByRole("navigation", { name: "Main" })[0]);
}

describe("Header", () => {
  it("shows every tab, the Learn menu, and the Check My Assessment button", () => {
    render(<Header />);
    const nav = desktopNav();
    for (const label of ["Home", "Town Rankings", "Appeal Checker", "About"]) {
      expect(nav.getByRole("link", { name: label })).toBeTruthy();
    }
    expect(nav.getByRole("button", { name: "Learn" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Check My Assessment" }).length).toBeGreaterThan(0);
  });

  it("has no Contact tab (Contact lives in the footer)", () => {
    render(<Header />);
    expect(desktopNav().queryByRole("link", { name: "Contact" })).toBeNull();
  });

  it("marks only the current tab as the current page", () => {
    pathname = "/check";
    render(<Header />);
    const nav = desktopNav();
    expect(nav.getByRole("link", { name: "Appeal Checker" }).getAttribute("aria-current")).toBe("page");
    expect(nav.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
  });

  it("highlights Town Rankings on a town page", () => {
    pathname = "/towns/ridgewood";
    render(<Header />);
    expect(desktopNav().getByRole("link", { name: "Town Rankings" }).getAttribute("aria-current")).toBe("page");
  });

  it("highlights Learn on How It Works and Appeal Guide", () => {
    pathname = "/appeal-guide";
    render(<Header />);
    expect(desktopNav().getByRole("button", { name: "Learn" }).getAttribute("data-active")).toBe("true");
  });
});
