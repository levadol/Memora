import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GlassCard } from "@/components/ui/GlassCard";

describe("GlassCard", () => {
  it("renders children", () => {
    render(<GlassCard>hello</GlassCard>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("applies glass class by default", () => {
    const { container } = render(<GlassCard>x</GlassCard>);
    expect(container.firstChild).toHaveClass("glass");
  });

  it("renders as article when as=article", () => {
    const { container } = render(<GlassCard as="article">x</GlassCard>);
    expect(container.querySelector("article")).not.toBeNull();
  });

  it("renders as section when as=section", () => {
    const { container } = render(<GlassCard as="section">x</GlassCard>);
    expect(container.querySelector("section")).not.toBeNull();
  });

  it("merges extra className", () => {
    const { container } = render(<GlassCard className="extra">x</GlassCard>);
    expect(container.firstChild).toHaveClass("extra");
  });

  it("forwards ref", () => {
    let ref: HTMLDivElement | null = null;
    render(
      <GlassCard ref={(el) => { ref = el; }}>x</GlassCard>
    );
    expect(ref).not.toBeNull();
  });
});
