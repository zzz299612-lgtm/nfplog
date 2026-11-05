export const TAGS = [
  { id: "plan", label: "일정" },
  { id: "task", label: "할 일" },
  { id: "mark", label: "기념" },
  { id: "memo", label: "메모" },
] as const;

export type Tag = (typeof TAGS)[number]["id"];

export function isTag(value: string): value is Tag {
  return TAGS.some((tag) => tag.id === value);
}

export type Role = "owner" | "member";

export type CalendarSummary = {
  id: string;
  name: string;
  inviteCode: string;
  role: Role;
  memberCount: number;
};

export type Member = {
  userId: string;
  displayName: string;
  role: Role;
};

export type CalEvent = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  note: string;
  startsOn: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  tag: Tag;
};

export type DayNote = {
  id: string;
  authorId: string;
  authorName: string;
  day: string;
  body: string;
};

export type MonthPayload = {
  calendar: CalendarSummary;
  coverImage: string | null;
  members: Member[];
  events: CalEvent[];
  notes: DayNote[];
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export const CALENDAR_STORAGE_KEY = "uridal.calendar";
