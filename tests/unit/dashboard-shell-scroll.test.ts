import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Dashboard Scrollbar Policy", () => {
  it("defines no-scrollbar utilities and scoped selectors in globals.css", () => {
    const cssPath = path.resolve(__dirname, "../../app/globals.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    expect(css).toContain(".no-scrollbar");
    expect(css).toContain("scrollbar-width: none");
    expect(css).toContain("display: none");
    expect(css).toContain("html:has([data-dashboard-shell])");
    expect(css).toContain("body:has([data-dashboard-shell])");
    expect(css).toContain("[data-dashboard-shell]");
  });

  it("applies data-dashboard-shell and no-scrollbar in DashboardShell", () => {
    const shellPath = path.resolve(__dirname, "../../features/dashboard/ui/dashboard-shell.tsx");
    const content = fs.readFileSync(shellPath, "utf-8");

    expect(content).toContain("data-dashboard-shell");
    expect(content).toContain("no-scrollbar");
    expect(content).toContain("document.documentElement.classList.add(\"no-scrollbar\")");
    expect(content).toContain("document.body.classList.add(\"no-scrollbar\")");
  });
});
