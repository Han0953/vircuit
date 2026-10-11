import { describe, expect, it } from "vitest";
import { BrandLogo } from "@/components/shared/brand-logo";
import React from "react";

describe("BrandLogo component", () => {
  it("renders both icon mark and wordmark by default", () => {
    const element = BrandLogo({ size: "default" });
    expect(React.isValidElement(element)).toBe(true);
    // element is a <span> containing two Image elements
    const children = React.Children.toArray(element.props.children);
    expect(children).toHaveLength(2);

    const [iconChild, textChild] = children as React.ReactElement<{ src: string; alt: string; width: number; height: number }>[];
    expect(iconChild.props.src).toBe("/Logo.webp");
    expect(textChild.props.src).toBe("/logo-teks.webp");
    expect(textChild.props.alt).toBe("Vircuit");
  });

  it("renders only icon when iconOnly is true", () => {
    const element = BrandLogo({ iconOnly: true });
    const children = React.Children.toArray(element.props.children).filter(Boolean);
    expect(children).toHaveLength(1);

    const iconChild = children[0] as React.ReactElement<{ src: string; alt: string }>;
    expect(iconChild.props.src).toBe("/Logo.webp");
    expect(iconChild.props.alt).toBe("Vircuit");
  });

  it("renders only text when textOnly is true", () => {
    const element = BrandLogo({ textOnly: true });
    const children = React.Children.toArray(element.props.children).filter(Boolean);
    expect(children).toHaveLength(1);

    const textChild = children[0] as React.ReactElement<{ src: string; alt: string }>;
    expect(textChild.props.src).toBe("/logo-teks.webp");
    expect(textChild.props.alt).toBe("Vircuit");
  });

  it("configures dimension sizes properly across sm, default, and lg", () => {
    const sm = BrandLogo({ size: "sm" });
    const [smIcon, smText] = React.Children.toArray(sm.props.children) as React.ReactElement<{ height: number }>[];
    expect(smIcon.props.height).toBe(22);
    expect(smText.props.height).toBe(15);

    const def = BrandLogo({ size: "default" });
    const [defIcon, defText] = React.Children.toArray(def.props.children) as React.ReactElement<{ height: number }>[];
    expect(defIcon.props.height).toBe(28);
    expect(defText.props.height).toBe(18);

    const lg = BrandLogo({ size: "lg" });
    const [lgIcon, lgText] = React.Children.toArray(lg.props.children) as React.ReactElement<{ height: number }>[];
    expect(lgIcon.props.height).toBe(34);
    expect(lgText.props.height).toBe(22);
  });
});
