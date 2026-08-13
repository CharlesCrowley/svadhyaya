import { describe, expect, it } from "vitest";
import { contributionCalendar, formatClock, madridDate } from "./time";

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

describe("contributionCalendar", () => {
  it("runs from Sunday to Saturday and leaves future dates blank", () => {
    const dates = contributionCalendar(2, new Date("2026-08-13T10:00:00Z"));
    expect(dates[0]).toBe("2026-08-02");
    expect(dates[7]).toBe("2026-08-09");
    expect(dates[11]).toBe("2026-08-13");
    expect(dates.slice(12)).toEqual([null, null]);
  });
});
