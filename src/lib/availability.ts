import { DEFAULT_HOURS, type AppState, type WeekHours } from "./types";

export function formatSlot(iso: string) {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function openSlots(physioId: string, state: AppState, daysAhead = 10) {
  const hours: WeekHours =
    state.doctors.find((d) => d.userId === physioId)?.availability ?? DEFAULT_HOURS;
  const days = hours.days ?? DEFAULT_HOURS.days;
  const slotMin = hours.slotMin || 30;
  const taken = new Set(
    [
      ...(state.bookings ?? []).filter(
        (b) => b.physioId === physioId && b.status === "upcoming",
      ),
      ...state.consults.filter(
        (c) =>
          c.physioId === physioId && (c.status === "upcoming" || c.status === "live"),
      ),
    ].map((item) => new Date(item.scheduledAt).setSeconds(0, 0)),
  );

  const slots: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let d = 0; d < daysAhead; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    if (!days.includes(day.getDay())) continue;
    for (let hour = hours.startHour; hour < hours.endHour; hour++) {
      for (let min = 0; min < 60; min += slotMin) {
        const slot = new Date(day);
        slot.setHours(hour, min, 0, 0);
        if (slot.getTime() <= Date.now()) continue;
        if (taken.has(slot.getTime())) continue;
        slots.push(slot.toISOString());
      }
    }
  }
  return slots;
}
