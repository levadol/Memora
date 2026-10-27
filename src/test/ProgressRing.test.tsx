import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressRing } from "@/components/ui/ProgressRing";

function getOffset(container: HTMLElement): number {
  const arc = container.querySelectorAll("circle")[1];
  return parseFloat(arc.getAttribute("stroke-dashoffset")!);
}

function getCircumference(container: HTMLElement): number {
  const arc = container.querySelectorAll("circle")[1];
  return parseFloat(arc.getAttribute("stroke-dasharray")!);
}

describe("ProgressRing", () => {
  it("renders an svg", () => {
    const { container } = render(<ProgressRing value={0.5} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("offset is 0 when value=1", () => {
    const { container } = render(<ProgressRing value={1} />);
    expect(getOffset(container)).toBeCloseTo(0, 1);
  });

  it("offset equals circumference when value=0", () => {
    const { container } = render(<ProgressRing value={0} />);
    const c = getCircumference(container);
    expect(getOffset(container)).toBeCloseTo(c, 1);
  });

  it("offset is half circumference when value=0.5", () => {
    const { container } = render(<ProgressRing value={0.5} />);
    const c = getCircumference(container);
    expect(getOffset(container)).toBeCloseTo(c * 0.5, 1);
  });

  it("clamps value>1 to 1", () => {
    const { container } = render(<ProgressRing value={2} />);
    expect(getOffset(container)).toBeCloseTo(0, 1);
  });

  it("clamps value<0 to 0", () => {
    const { container } = render(<ProgressRing value={-1} />);
    const c = getCircumference(container);
    expect(getOffset(container)).toBeCloseTo(c, 1);
  });

  it("uses custom size", () => {
    const { container } = render(<ProgressRing value={0.5} size={128} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("128");
    expect(svg.getAttribute("height")).toBe("128");
  });

  it("renders aria-label when provided", () => {
    const { container } = render(
      <ProgressRing value={0.5} aria-label="Progress 50%" />
    );
    expect(container.querySelector("[aria-label]")).not.toBeNull();
  });
});
