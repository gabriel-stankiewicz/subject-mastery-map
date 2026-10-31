import { describe, it, expect } from "vitest";
import { daysLeft, progress } from "./planner";

describe("planner", () => {
  it("counts days left to exam", () => {
    expect(daysLeft("2026-11-10", new Date(2026, 9, 31, 15))).toBe(10);
    expect(daysLeft("2026-10-31", new Date(2026, 9, 31, 23))).toBe(0);
  });
  it("computes progress from checked topics", () => {
    expect(progress([{ id: "a", title: "", done: true }, { id: "b", title: "", done: false }, { id: "c", title: "", done: false }])).toBe(33);
    expect(progress([])).toBe(0);
  });
});
