export function formatClock(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function madridDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function displayDate(date = new Date()): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

export function recentDates(count: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    dates.push(madridDate(date));
  }
  return dates;
}

export function contributionCalendar(weeks: number, now = new Date()): Array<string | null> {
  const today = madridDate(now);
  const cursor = new Date(`${today}T12:00:00`);
  cursor.setDate(cursor.getDate() - cursor.getDay() - ((weeks - 1) * 7));

  return Array.from({ length: weeks * 7 }, () => {
    const date = madridDate(cursor);
    cursor.setDate(cursor.getDate() + 1);
    return date <= today ? date : null;
  });
}
