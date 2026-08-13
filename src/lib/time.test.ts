import { describe, expect, it } from "vitest";
import { formatClock, madridDate } from "./time";

describe("formatClock", () => {
  it("formats whole minutes and seconds", () => {
    expect(formatClock(125.9)).toBe("2:05");
  });

  it("does not show negative time", () => {
    expect(formatClock(-4)).toBe("0:00");
  });
});

describe("madridDate", () => {
  it("uses the Europe/Madrid calendar date", () => {
    expect(madridDate(new Date("2026-01-01T23:30:00Z"))).toBe("2026-01-02");
  });
});
