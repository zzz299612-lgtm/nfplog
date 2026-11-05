import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { AppUser } from "@/lib/auth/use-current-user";
import { listCalendars } from "@/lib/calendar/api";
import { CALENDAR_STORAGE_KEY, type CalendarSummary } from "@/lib/calendar/types";
import {
  AfterMount,
  errText,
  Frame,
  ShellSkeleton,
} from "@/components/calendar/chrome";
import { Workspace } from "@/components/calendar/workspace";

function WorkspaceGate({ user }: { user: AppUser }) {
  const [calendars, setCalendars] = useState<CalendarSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const result = await listCalendars();
      if (!result.ok) {
        setError(result.error);
        setCalendars((prev) => prev ?? []);
        return;
      }
      setError("");
      setCalendars(result.data);
      setActiveId((current) => {
        if (current && result.data.some((item) => item.id === current)) return current;
        const saved = localStorage.getItem(CALENDAR_STORAGE_KEY);
        return result.data.find((item) => item.id === saved)?.id ?? result.data[0]?.id ?? null;
      });
    } catch (caught) {
      setError(errText(caught));
      setCalendars((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (activeId) localStorage.setItem(CALENDAR_STORAGE_KEY, activeId);
  }, [activeId]);

  useEffect(() => {
    if (!calendars || calendars.length === 0) return;
    if (activeId && calendars.some((item) => item.id === activeId)) return;
    setActiveId(calendars[0]?.id ?? null);
  }, [calendars, activeId]);

  const add = useCallback((calendar: CalendarSummary) => {
    setCalendars((prev) => [calendar, ...(prev ?? []).filter((item) => item.id !== calendar.id)]);
    setActiveId(calendar.id);
  }, []);

  const patch = useCallback((calendar: CalendarSummary) => {
    setCalendars((prev) => {
      if (!prev) return prev;
      const current = prev.find((item) => item.id === calendar.id);
      if (
        current &&
        current.name === calendar.name &&
        current.inviteCode === calendar.inviteCode &&
        current.role === calendar.role &&
        current.memberCount === calendar.memberCount
      ) {
        return prev;
      }
      return prev.map((item) => (item.id === calendar.id ? calendar : item));
    });
  }, []);

  const remove = useCallback((id: string) => {
    setCalendars((prev) => (prev ?? []).filter((item) => item.id !== id));
    setActiveId((current) => (current === id ? null : current));
  }, []);

  if (!calendars) return <ShellSkeleton />;

  if (error && calendars.length === 0) {
    return (
      <Frame>
        <div className="mx-auto grid max-w-md gap-3">
          <h2 className="font-display text-3xl leading-tight">달력을 열지 못했습니다</h2>
          <p role="alert">{error}</p>
          <button
            type="button"
            className="press h-11 bg-pine px-4 text-sm font-medium text-on-pine"
            onClick={() => {
              setCalendars(null);
              void reload();
            }}
          >
            다시 시도
          </button>
        </div>
      </Frame>
    );
  }

  const active = calendars.find((item) => item.id === activeId) ?? calendars[0];
  if (!active) {
    return (
      <Frame>
        <div className="mx-auto grid max-w-md gap-3">
          <h2 className="font-display text-3xl leading-tight">달력을 여는 중이에요</h2>
          <button
            type="button"
            className="press h-11 bg-pine px-4 text-sm font-medium text-on-pine"
            onClick={() => {
              setCalendars(null);
              void reload();
            }}
          >
            다시 시도
          </button>
        </div>
      </Frame>
    );
  }

  return (
    <Workspace
      user={user}
      calendars={calendars}
      active={active}
      onSelect={setActiveId}
      onAdd={add}
      onPatch={patch}
      onRemove={remove}
    />
  );
}

const SHARE_USER: AppUser = {
  id: "guest",
  displayName: "함께",
  primaryEmail: null,
  profileImageUrl: null,
  isDevFallback: true,
};

const PASSWORD = "3020";
const UNLOCK_KEY = "nfplog-unlocked";

function PasswordGate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() => localStorage.getItem(UNLOCK_KEY) === "1");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (value.trim() === PASSWORD) {
      localStorage.setItem(UNLOCK_KEY, "1");
      setOpen(true);
      setError("");
      return;
    }
    setError("비밀번호가 달라요");
    setValue("");
  }

  if (open) return children;

  return (
    <Frame>
      <form onSubmit={onSubmit} className="rise mx-auto grid max-w-sm gap-3">
        <h2 className="font-display text-3xl leading-tight">비밀번호</h2>
        <p className="text-sm text-muted">둘만 아는 숫자로 달력을 열어요.</p>
        <label className="sr-only" htmlFor="door-password">
          비밀번호
        </label>
        <input
          id="door-password"
          className="field text-center text-lg tracking-[0.3em]"
          value={value}
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={8}
          placeholder="••••"
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          required
        />
        {error ? (
          <p role="alert" className="text-sm text-rose">
            {error}
          </p>
        ) : null}
        <button type="submit" className="press h-11 bg-pine text-sm font-medium text-on-pine">
          열기
        </button>
      </form>
    </Frame>
  );
}

function HomeReady() {
  return (
    <PasswordGate>
      <WorkspaceGate user={SHARE_USER} />
    </PasswordGate>
  );
}

export function CalendarScreen() {
  return (
    <AfterMount fallback={<ShellSkeleton />}>
      <HomeReady />
    </AfterMount>
  );
}
