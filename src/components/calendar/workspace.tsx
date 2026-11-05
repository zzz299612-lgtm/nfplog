import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import type { AppUser } from "@/lib/auth/use-current-user";
import {
  deleteEvent,
  deleteNote,
  loadMonth,
  saveEvent,
  saveNote,
  setCover,
} from "@/lib/calendar/api";
import {
  dayNumber,
  dayTitle,
  monthGrid,
  monthTitle,
  sameMonth,
  shiftMonth,
  todayYmd,
  WEEKDAY_LABELS,
  weekdayShort,
} from "@/lib/calendar/dates";
import { TAGS, type CalEvent, type CalendarSummary, type MonthPayload, type Tag } from "@/lib/calendar/types";
import { errText, Frame } from "@/components/calendar/chrome";

function shrinkCover(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const max = 960;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("이미지를 읽지 못했습니다"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      let quality = 0.72;
      let data = canvas.toDataURL("image/jpeg", quality);
      while (data.length > 700_000 && quality > 0.4) {
        quality -= 0.1;
        data = canvas.toDataURL("image/jpeg", quality);
      }
      if (!data.startsWith("data:image/jpeg") || data.length > 900_000) {
        reject(new Error("사진이 너무 커요. 더 작은 사진으로 올려 주세요"));
        return;
      }
      resolve(data);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이 사진은 열 수 없어요. jpg나 png로 다시 올려 주세요"));
    };
    image.src = url;
  });
}

const WRITERS = ["근수", "진희"] as const;
const WRITER_KEY = "nfplog.writers";

function loadWriters(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WRITER_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return WRITERS.filter((name) => parsed.includes(name));
  } catch {
    return [];
  }
}

function writersFromName(name: string): string[] {
  return WRITERS.filter((writer) => name.includes(writer));
}

function writerTone(name: string): "geun" | "jin" | "both" | "none" {
  const geun = name.includes("근수");
  const jin = name.includes("진희");
  if (geun && jin) return "both";
  if (geun) return "geun";
  if (jin) return "jin";
  return "none";
}

function toneClass(tone: ReturnType<typeof writerTone>): string {
  if (tone === "geun") return "bg-[#D5D1C8] text-ink";
  if (tone === "jin") return "bg-[#B7D7A8] text-ink";
  if (tone === "both") return "bg-[#E3D4F2] text-ink";
  return "bg-paper-2 text-ink";
}

function WhoChecks({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">누가 적었는지</legend>
      {WRITERS.map((name) => {
        const on = value.includes(name);
        return (
          <label
            key={name}
            className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-sm ${
              on ? "bg-pine text-on-pine" : "bg-paper-2 text-ink"
            }`}
          >
            <input
              type="checkbox"
              className="size-4 accent-current"
              checked={on}
              onChange={() => {
                const next = on ? value.filter((item) => item !== name) : [...value, name];
                onChange(WRITERS.filter((writer) => next.includes(writer)));
              }}
            />
            {name}
          </label>
        );
      })}
    </fieldset>
  );
}

type Draft = {
  id: string | null;
  title: string;
  note: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  tag: Tag;
};

function emptyDraft(): Draft {
  return {
    id: null,
    title: "",
    note: "",
    allDay: true,
    startTime: "09:00",
    endTime: "10:00",
    tag: "plan",
  };
}

function draftFrom(event: CalEvent): Draft {
  return {
    id: event.id,
    title: event.title,
    note: event.note,
    allDay: event.allDay,
    startTime: event.startTime ?? "09:00",
    endTime: event.endTime ?? "10:00",
    tag: event.tag,
  };
}

function whenLabel(event: CalEvent): string {
  if (event.allDay) return "하루 종일";
  if (event.startTime && event.endTime) return `${event.startTime}–${event.endTime}`;
  return event.startTime ?? "시간 미정";
}

function TagMark({ tag, inverted }: { tag: Tag; inverted?: boolean }) {
  const fill =
    tag === "task"
      ? inverted
        ? "bg-on-pine"
        : "bg-mint"
      : tag === "mark"
        ? inverted
          ? "bg-on-pine"
          : "bg-butter"
        : tag === "memo"
          ? inverted
            ? "bg-on-pine"
            : "bg-rose"
          : inverted
            ? "bg-on-pine"
            : "bg-blush";
  if (tag === "task") {
    return <span className={`size-2 shrink-0 rounded-full border border-current ${inverted ? "text-on-pine" : "text-ink"}`} />;
  }
  if (tag === "mark") {
    return <span className={`size-2 shrink-0 rotate-45 ${fill}`} />;
  }
  if (tag === "memo") {
    return <span className={`h-0.5 w-2 shrink-0 rounded-full ${fill}`} />;
  }
  return <span className={`size-2 shrink-0 rounded-full ${fill}`} />;
}

function eventsOn(events: CalEvent[], day: string): CalEvent[] {
  return events.filter((event) => event.startsOn === day);
}

export function Workspace({
  user,
  calendars,
  active,
  onSelect,
  onAdd,
  onPatch,
  onRemove,
}: {
  user: AppUser;
  calendars: CalendarSummary[];
  active: CalendarSummary;
  onSelect: (id: string) => void;
  onAdd: (calendar: CalendarSummary) => void;
  onPatch: (calendar: CalendarSummary) => void;
  onRemove: (id: string) => void;
}) {
  const today = useMemo(() => todayYmd(), []);
  const initial = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month0: now.getMonth() };
  }, []);
  const [year, setYear] = useState(initial.year);
  const [month0, setMonth0] = useState(initial.month0);
  const [selected, setSelected] = useState(today);
  const [payload, setPayload] = useState<MonthPayload | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [noteBody, setNoteBody] = useState("");
  const [writers, setWriters] = useState<string[]>([]);
  const [saving, setSaving] = useState<"" | "event" | "note" | "meta" | "cover">("");
  const [coverOverride, setCoverOverride] = useState<string | null | undefined>(undefined);
  const seq = useRef(0);
  const statusTimer = useRef<number | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const days = useMemo(() => monthGrid(year, month0), [year, month0]);
  const from = days[0] ?? today;
  const to = days[days.length - 1] ?? today;


  useEffect(() => {
    setWriters(loadWriters());
  }, []);

  useEffect(() => {
    setDraft(emptyDraft());
    setNoteBody("");
  }, [selected, active.id]);

  function chooseWriters(next: string[]) {
    setWriters(next);
    window.localStorage.setItem(WRITER_KEY, JSON.stringify(next));
  }

  const refresh = useCallback(async () => {
    const token = ++seq.current;
    try {
      const result = await loadMonth({ data: { calendarId: active.id, from, to } });
      if (token !== seq.current) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError("");
      setPayload(result.data);
      onPatch(result.data.calendar);
    } catch (caught) {
      if (token !== seq.current) return;
      setError(errText(caught));
    }
  }, [active.id, from, to, onPatch]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 8000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (statusTimer.current) window.clearTimeout(statusTimer.current);
    };
  }, []);

  function noteStatus(message: string) {
    setStatus(message);
    if (statusTimer.current) window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setStatus(""), 2200);
  }

  function moveMonth(delta: number) {
    const next = shiftMonth(year, month0, delta);
    const grid = monthGrid(next.year, next.month0);
    setYear(next.year);
    setMonth0(next.month0);
    if (!grid.includes(selected)) {
      const todayNow = todayYmd();
      const inMonth = grid.find((day) => sameMonth(day, next.year, next.month0));
      setSelected(grid.includes(todayNow) ? todayNow : (inMonth ?? grid[0] ?? selected));
    }
  }

  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth0(now.getMonth());
    setSelected(todayYmd());
  }

  function chooseDay(day: string) {
    const date = new Date(
      Number(day.slice(0, 4)),
      Number(day.slice(5, 7)) - 1,
      Number(day.slice(8, 10)),
    );
    if (!sameMonth(day, year, month0)) {
      setYear(date.getFullYear());
      setMonth0(date.getMonth());
    }
    setSelected(day);
    if (window.matchMedia("(max-width: 767px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.requestAnimationFrame(() => {
        document.getElementById("day-panel")?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        });
      });
    }
  }

  async function onSaveEvent(event: FormEvent) {
    event.preventDefault();
    setSaving("event");
    setError("");
    if (writers.length < 1) {
      setError("누가 적었는지 골라 주세요");
      setSaving("");
      return;
    }
    try {
      const result = await saveEvent({
        data: {
          id: draft.id ?? "",
          calendarId: active.id,
          title: draft.title,
          note: draft.note,
          startsOn: selected,
          allDay: draft.allDay,
          startTime: draft.allDay ? "" : draft.startTime,
          endTime: draft.allDay ? "" : draft.endTime,
          tag: draft.tag,
          writers,
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft(emptyDraft());
      noteStatus(draft.id ? "일정을 고쳤습니다" : "일정을 남겼습니다");
      await refresh();
    } catch (caught) {
      setError(errText(caught));
    } finally {
      setSaving("");
    }
  }

  async function onDeleteEvent(id: string) {
    setError("");
    try {
      const result = await deleteEvent({ data: { calendarId: active.id, id } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (draft.id === id) setDraft(emptyDraft());
      noteStatus("일정을 지웠습니다");
      await refresh();
    } catch (caught) {
      setError(errText(caught));
    }
  }

  async function onSaveNote(event: FormEvent) {
    event.preventDefault();
    setSaving("note");
    setError("");
    if (writers.length < 1) {
      setError("누가 적었는지 골라 주세요");
      setSaving("");
      return;
    }
    try {
      const result = await saveNote({
        data: { calendarId: active.id, day: selected, body: noteBody, writers },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNoteBody("");
      noteStatus("기록을 남겼습니다");
      await refresh();
    } catch (caught) {
      setError(errText(caught));
    } finally {
      setSaving("");
    }
  }

  async function onPickCover(file: File | undefined) {
    if (!file) return;
    setSaving("cover");
    setError("");
    try {
      const image = await shrinkCover(file);
      setCoverOverride(image);
      const result = await setCover({ data: { calendarId: active.id, image } });
      if (!result.ok) {
        setCoverOverride(undefined);
        setError(result.error);
        return;
      }
      setCoverOverride(result.data.coverImage);
      noteStatus("표지를 바꿨어요");
    } catch (caught) {
      setError(errText(caught));
    } finally {
      setSaving("");
    }
  }

  async function onResetCover() {
    setSaving("cover");
    setError("");
    try {
      const result = await setCover({ data: { calendarId: active.id, image: null } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCoverOverride(null);
      noteStatus("기본 표지로 돌렸어요");
    } catch (caught) {
      setError(errText(caught));
    } finally {
      setSaving("");
    }
  }

  async function onDeleteNote(id: string) {
    setError("");
    try {
      const result = await deleteNote({ data: { calendarId: active.id, id } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      noteStatus("기록을 지웠습니다");
      await refresh();
    } catch (caught) {
      setError(errText(caught));
    }
  }

  const readyPayload = payload?.calendar.id === active.id ? payload : null;
  const events = readyPayload?.events ?? [];
  const notes = (readyPayload?.notes ?? []).filter((note) => note.day === selected);
  const dayEvents = eventsOn(events, selected);
  const members = readyPayload?.members ?? [];
  const ready = readyPayload !== null;

  const coverSrc =
    coverOverride !== undefined
      ? coverOverride || "/cover.svg"
      : readyPayload?.coverImage || "/cover.svg";
  const hasCustomCover = coverSrc !== "/cover.svg";

  return (
    <Frame>
      <div className="flex flex-col gap-4">
        <div className="relative">
          <img
            src={coverSrc}
            alt=""
            className="aspect-[1200/630] w-full rounded-3xl object-cover ring-1 ring-line"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="press h-11 bg-pine px-4 text-sm font-medium text-on-pine disabled:opacity-50"
              disabled={saving === "cover"}
              onClick={() => coverInput.current?.click()}
            >
              {saving === "cover" ? "올리는 중" : "표지 바꾸기"}
            </button>
            {hasCustomCover ? (
              <button
                type="button"
                className="press h-11 bg-card px-4 text-sm font-medium text-ink ring-1 ring-line disabled:opacity-50"
                disabled={saving === "cover"}
                onClick={() => void onResetCover()}
              >
                기본 표지
              </button>
            ) : null}
            <input
              ref={coverInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              className="absolute h-px w-px opacity-0"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void onPickCover(file);
              }}
            />
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-3xl leading-none">{active.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {members.length <= 1
              ? "같이 적는 달력이에요."
              : members.map((member) => member.displayName).join(" · ")}
          </p>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-paper-2 px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {status}
        </p>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.45fr)_22rem]">
          <section className="panel rounded-3xl p-3 md:p-4" aria-label="월간 달력">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="press grid size-11 place-items-center rounded-full hover:bg-paper-2"
                  aria-label="이전 달"
                  onClick={() => moveMonth(-1)}
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <h2 className="min-w-36 text-center font-display text-3xl font-medium tabular-nums">
                  {monthTitle(year, month0)}
                </h2>
                <button
                  type="button"
                  className="press grid size-11 place-items-center rounded-full hover:bg-paper-2"
                  aria-label="다음 달"
                  onClick={() => moveMonth(1)}
                >
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                className="press h-11 rounded-full px-4 text-sm font-medium text-pine"
                onClick={goToday}
              >
                오늘
              </button>
            </div>
            <div className="mb-2 flex flex-wrap gap-2 px-1 text-xs text-ink">
              <span className="rounded-full bg-[#D5D1C8] px-2.5 py-1">근수</span>
              <span className="rounded-full bg-[#B7D7A8] px-2.5 py-1">진희</span>
              <span className="rounded-full bg-[#E3D4F2] px-2.5 py-1">둘 다</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((label, index) => (
                <div
                  key={label}
                  className={`py-2 text-center text-xs font-medium ${index === 0 ? "text-pine" : "text-muted"}`}
                >
                  {label}
                </div>
              ))}
              {days.map((day) => {
                const inMonth = sameMonth(day, year, month0);
                const isSelected = day === selected;
                const isToday = day === today;
                const cellEvents = eventsOn(events, day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={isSelected}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${dayTitle(day)}, 일정 ${cellEvents.length}개${isToday ? ", 오늘" : ""}`}
                    onClick={() => chooseDay(day)}
                    className={`press flex min-h-16 flex-col items-stretch gap-1 rounded-2xl px-0.5 py-1.5 md:min-h-28 md:px-1 ${
                      isSelected
                        ? "bg-pine text-on-pine"
                        : isToday
                          ? "bg-butter text-ink"
                          : "text-ink hover:bg-paper-2"
                    } ${inMonth ? "" : "opacity-45"}`}
                  >
                    <span className="px-0.5 text-center text-sm font-medium tabular-nums">{dayNumber(day)}</span>
                    <span className="flex flex-col gap-0.5">
                      {cellEvents.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className={`truncate rounded px-1 py-0.5 text-left text-[10px] leading-tight md:text-xs ${toneClass(writerTone(item.authorName))}`}
                        >
                          {item.title}
                        </span>
                      ))}
                      {cellEvents.length > 3 ? (
                        <span className={`text-[10px] tabular-nums ${isSelected ? "text-on-pine" : "text-muted"}`}>
                          +{cellEvents.length - 3}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section id="day-panel" className="panel rise rounded-3xl p-4" aria-label="선택한 날">
            <p className="text-xs font-medium text-muted">{weekdayShort(selected)}요일</p>
            <h2 className="font-display text-3xl font-medium tabular-nums">
              {dayNumber(selected)}
            </h2>
            <p className="text-sm text-muted">{dayTitle(selected)}</p>
            {status ? <p className="mt-2 text-sm text-pine">{status}</p> : null}

            <form onSubmit={onSaveEvent} className="mt-4 grid gap-3 border-t border-line pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">{draft.id ? "일정 고치기" : "일정"}</h3>
                {draft.id ? (
                  <button
                    type="button"
                    className="text-sm text-muted"
                    onClick={() => setDraft(emptyDraft())}
                  >
                    취소
                  </button>
                ) : null}
              </div>
              <WhoChecks value={writers} onChange={chooseWriters} />
              <label className="sr-only" htmlFor="event-title">
                일정 제목
              </label>
              <input
                id="event-title"
                className="field"
                value={draft.title}
                maxLength={80}
                placeholder="점심, 회의, 생일"
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="일정 종류">
                {TAGS.map((tag) => {
                  const on = draft.tag === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      className={`press inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm ${
                        on ? "bg-pine text-on-pine" : "bg-paper-2 text-ink"
                      }`}
                      onClick={() => setDraft((prev) => ({ ...prev, tag: tag.id }))}
                    >
                      <TagMark tag={tag.id} inverted={on} />
                      {tag.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="press h-11 justify-self-start rounded-lg px-1 text-sm font-medium text-pine"
                aria-pressed={draft.allDay}
                onClick={() => setDraft((prev) => ({ ...prev, allDay: !prev.allDay }))}
              >
                {draft.allDay ? "하루 종일" : "시간 지정"}
              </button>
              {draft.allDay ? null : (
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-xs font-medium text-muted" htmlFor="start-time">
                    시작
                    <input
                      id="start-time"
                      type="time"
                      className="field"
                      value={draft.startTime}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, startTime: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted" htmlFor="end-time">
                    끝
                    <input
                      id="end-time"
                      type="time"
                      className="field"
                      value={draft.endTime}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, endTime: event.target.value }))
                      }
                    />
                  </label>
                </div>
              )}
              <label className="sr-only" htmlFor="event-note">
                일정 메모
              </label>
              <textarea
                id="event-note"
                className="field"
                value={draft.note}
                maxLength={500}
                placeholder="장소나 준비물"
                onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
              />
              <button
                type="submit"
                className="press h-11 rounded-lg bg-pine text-sm font-medium text-on-pine hover:bg-pine-hover disabled:opacity-50"
                disabled={saving === "event"}
              >
                {saving === "event" ? "저장 중" : draft.id ? "일정 저장" : "일정 추가"}
              </button>
            </form>

            <ul className="mt-4 grid gap-2">
              {!ready ? (
                <li className="h-16 animate-pulse rounded-xl bg-paper-2" />
              ) : dayEvents.length === 0 ? (
                <li className="text-sm text-muted">이 날의 일정이 없습니다.</li>
              ) : (
                dayEvents.map((item) => {
                  const mine = item.authorId === user.id;
                  const canDelete = mine || active.role === "owner";
                  return (
                    <li key={item.id} className={`rounded-xl px-3 py-3 ${toneClass(writerTone(item.authorName))}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium">
                            <TagMark tag={item.tag} />
                            <span className="truncate">{item.title}</span>
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {whenLabel(item)} · {item.authorName}
                          </p>
                          {item.note ? <p className="mt-1 text-sm">{item.note}</p> : null}
                        </div>
                        <div className="flex shrink-0">
                          {mine ? (
                            <button
                              type="button"
                              className="press grid size-11 place-items-center rounded-full text-muted hover:bg-paper-2"
                              aria-label={`${item.title} 수정`}
                              onClick={() => {
                                setDraft(draftFrom(item));
                                const named = writersFromName(item.authorName);
                                if (named.length > 0) chooseWriters(named);
                              }}
                            >
                              <Pencil className="size-4" aria-hidden />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              className="press grid size-11 place-items-center rounded-full text-muted hover:bg-paper-2"
                              aria-label={`${item.title} 지우기`}
                              onClick={() => void onDeleteEvent(item.id)}
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>

            <form onSubmit={onSaveNote} className="mt-6 grid gap-3 border-t border-line pt-4">
              <h3 className="text-sm font-medium">하루 기록</h3>
              <p className="text-xs text-muted">일정만 적어도 돼요. 기록은 비워도 됩니다.</p>
              <WhoChecks value={writers} onChange={chooseWriters} />
              <label className="sr-only" htmlFor="day-note">
                하루 기록
              </label>
              <textarea
                id="day-note"
                className="field"
                value={noteBody}
                maxLength={400}
                placeholder="남기고 싶을 때만 적어 주세요"
                onChange={(event) => setNoteBody(event.target.value)}
              />
              <button
                type="submit"
                className="press h-11 bg-mint text-sm font-medium text-ink disabled:opacity-50"
                disabled={saving === "note" || noteBody.trim().length < 1}
              >
                {saving === "note" ? "남기는 중" : "기록 남기기"}
              </button>
            </form>
            <ul className="mt-3 grid gap-2">
              {ready && notes.length === 0 ? (
                <li className="text-sm text-muted">아직 기록이 없습니다.</li>
              ) : (
                notes.map((note) => {
                  const canDelete = note.authorId === user.id || active.role === "owner";
                  return (
                    <li key={note.id} className={`rounded-xl px-3 py-3 ${toneClass(writerTone(note.authorName))}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm">{note.body}</p>
                          <p className="mt-1 text-xs text-muted">{note.authorName}</p>
                        </div>
                        {canDelete ? (
                          <button
                            type="button"
                            className="press grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-paper-2"
                            aria-label="기록 지우기"
                            onClick={() => void onDeleteNote(note.id)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>
      </div>
    </Frame>
  );
}
