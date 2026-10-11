import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { BackButton } from "@/components/shared/back-button";
import React from "react";

const mockBack = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

describe("BackButton component", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("renders with default label 'Kembali'", () => {
    const element = BackButton({ fallbackHref: "/dashboard/learn" });
    expect(React.isValidElement(element)).toBe(true);
    expect(element.props["aria-label"]).toBe("Kembali");
  });

  it("renders with custom label", () => {
    const element = BackButton({
      fallbackHref: "/dashboard/learn",
      label: "Kembali ke Belajar",
    });
    expect(React.isValidElement(element)).toBe(true);
    expect(element.props["aria-label"]).toBe("Kembali ke Belajar");
  });

  it("triggers router.back() when history length > 1", () => {
    globalThis.window = {
      history: { length: 3 },
    } as unknown as Window & typeof globalThis;

    const element = BackButton({ fallbackHref: "/dashboard/learn" });
    element.props.onClick();

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("triggers router.push(fallbackHref) when history length <= 1", () => {
    globalThis.window = {
      history: { length: 1 },
    } as unknown as Window & typeof globalThis;

    const element = BackButton({ fallbackHref: "/dashboard/learn" });
    element.props.onClick();

    expect(mockPush).toHaveBeenCalledWith("/dashboard/learn");
    expect(mockBack).not.toHaveBeenCalled();
  });
});
