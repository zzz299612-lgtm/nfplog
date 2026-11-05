import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import {
  isTag,
  type CalendarSummary,
  type CalEvent,
  type DayNote,
  type Member,
  type MonthPayload,
  type Result,
  type Role,
  type Tag,
} from "@/lib/calendar/types";

class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    throw error;
  }
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") throw new UserError("요청을 확인해 주세요");
  return input as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function assertId(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new UserError("요청을 확인해 주세요");
  }
  return value;
}

function assertYmd(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new UserError("날짜를 확인해 주세요");
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new UserError("날짜를 확인해 주세요");
  }
  return value;
}

function assertTime(value: string | null, required: boolean): string | null {
  if (!value) {
    if (required) throw new UserError("시작 시간을 입력해 주세요");
    return null;
  }
  if (!/^\d{2}:\d{2}$/.test(value)) throw new UserError("시간 형식을 확인해 주세요");
  const hour = Number(value.slice(0, 2));
  const minute = Number(value.slice(3, 5));
  if (hour > 23 || minute > 59) throw new UserError("시간 형식을 확인해 주세요");
  return value;
}

function assertName(value: string): string {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 40) {
    throw new UserError("달력 이름은 1자에서 40자까지 적어 주세요");
  }
  return name;
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = "";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return code;
}

type SummaryRow = {
  id: string;
  name: string;
  invite_code: string;
  role: string;
  member_count: number | string;
};

function asRole(value: string): Role {
  if (value !== "owner" && value !== "member") throw new UserError("이 달력을 찾을 수 없습니다");
  return value;
}

function mapSummary(row: SummaryRow): CalendarSummary {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    role: asRole(row.role),
    memberCount: Number(row.member_count),
  };
}

const summarySelect = `
  select c.id, c.name, c.invite_code, m.role,
    (select count(*)::int from calendar_members mm where mm.calendar_id = c.id) as member_count
  from calendars c
  join calendar_members m on m.calendar_id = c.id
`;

async function callerName(sql: Sql, userId: string): Promise<string> {
  const rows = await sql<{ name: string }>`
    select "name" as name from "user" where "id" = ${userId} limit 1
  `;
  const name = rows[0]?.name?.trim() ?? "";
  return name ? name.slice(0, 40) : "함께";
}

async function syncName(sql: Sql, userId: string, name: string): Promise<void> {
  await sql`
    update calendar_members set display_name = ${name}
    where user_id = ${userId} and display_name <> ${name}
  `;
}

async function requireMember(sql: Sql, calendarId: string, userId: string): Promise<Role> {
  const rows = await sql<{ role: string }>`
    select role from calendar_members
    where calendar_id = ${calendarId} and user_id = ${userId}
    limit 1
  `;
  if (!rows[0]) throw new UserError("이 달력을 찾을 수 없습니다");
  return asRole(rows[0].role);
}

async function summaryFor(sql: Sql, calendarId: string, userId: string): Promise<CalendarSummary> {
  const rows = await sql<SummaryRow>`
    select c.id, c.name, c.invite_code, m.role,
      (select count(*)::int from calendar_members mm where mm.calendar_id = c.id) as member_count
    from calendars c
    join calendar_members m on m.calendar_id = c.id
    where c.id = ${calendarId} and m.user_id = ${userId}
    limit 1
  `;
  if (!rows[0]) throw new UserError("이 달력을 찾을 수 없습니다");
  return mapSummary(rows[0]);
}

type EventRow = {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  note: string;
  starts_on: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean | string;
  tag: string;
};

function mapEvent(row: EventRow): CalEvent {
  const tag: Tag = isTag(row.tag) ? row.tag : "plan";
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    title: row.title,
    note: row.note ?? "",
    startsOn: String(row.starts_on).slice(0, 10),
    startTime: row.start_time,
    endTime: row.end_time,
    allDay: row.all_day === true || row.all_day === "t" || row.all_day === "true",
    tag,
  };
}

type NoteRow = {
  id: string;
  author_id: string;
  author_name: string;
  day: string;
  body: string;
};

function mapNote(row: NoteRow): DayNote {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    day: String(row.day).slice(0, 10),
    body: row.body,
  };
}

type EventInput = {
  calendarId: string;
  title: string;
  note: string;
  startsOn: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  tag: Tag;
};

function readEventInput(input: unknown, withId: boolean): EventInput & { id?: string } {
  const record = asRecord(input);
  const calendarId = assertId(readString(record, "calendarId"));
  const title = readString(record, "title").trim().replace(/\s+/g, " ");
  if (title.length < 1 || title.length > 80) {
    throw new UserError("일정 제목은 1자에서 80자까지 적어 주세요");
  }
  const note = readString(record, "note").trim();
  if (note.length > 500) throw new UserError("메모는 500자까지 적을 수 있습니다");
  const startsOn = assertYmd(readString(record, "startsOn"));
  const allDay = record.allDay !== false;
  const startTime = assertTime(
    readString(record, "startTime").trim() || null,
    !allDay,
  );
  const endTime = assertTime(readString(record, "endTime").trim() || null, false);
  if (!allDay && startTime && endTime && endTime < startTime) {
    throw new UserError("끝나는 시간이 시작보다 빠릅니다");
  }
  const tagRaw = readString(record, "tag");
  if (!isTag(tagRaw)) throw new UserError("일정 종류를 선택해 주세요");
  const parsed: EventInput & { id?: string } = {
    calendarId,
    title,
    note,
    startsOn,
    allDay,
    startTime: allDay ? null : startTime,
    endTime: allDay ? null : endTime,
    tag: tagRaw,
  };
  if (withId) parsed.id = assertId(readString(record, "id"));
  return parsed;
}

const SHARE_ID = "guest";
const SINGLE_NAME = "프피로그";
const WRITERS = ["근수", "진희"] as const;

function readWriters(value: unknown): string {
  if (!Array.isArray(value)) throw new UserError("누가 적었는지 골라 주세요");
  const picked = WRITERS.filter((name) => value.includes(name));
  if (picked.length < 1) throw new UserError("누가 적었는지 골라 주세요");
  return picked.join(" · ");
}

async function ensureCalendar(sql: Sql, userId: string, name: string): Promise<string> {
  const found = await sql<{ id: string }>`select id from calendars order by created_at asc limit 1`;
  if (found[0]) {
    await sql`
      insert into calendar_members (calendar_id, user_id, display_name, role)
      values (${found[0].id}, ${userId}, ${name}, 'owner')
      on conflict (calendar_id, user_id) do update set role = 'owner'
    `;
    return found[0].id;
  }
  const id = crypto.randomUUID();
  const code = makeCode();
  await sql`
    with cal as (
      insert into calendars (id, name, invite_code, owner_id)
      values (${id}, ${SINGLE_NAME}, ${code}, ${userId})
      returning id
    )
    insert into calendar_members (calendar_id, user_id, display_name, role)
    select id, ${userId}, ${name}, 'owner' from cal
  `;
  return id;
}

export const listCalendars = createServerFn({ method: "GET" })
  .handler(async (): Promise<Result<CalendarSummary[]>> => {
    return run(async () => {
      const sql = await getSql();
      const name = await callerName(sql, SHARE_ID);
      await syncName(sql, SHARE_ID, name);
      const id = await ensureCalendar(sql, SHARE_ID, name);
      return [await summaryFor(sql, id, SHARE_ID)];
    });
  });

export const createCalendar = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<CalendarSummary>> => {
    return run(async () => {
      const name = assertName(readString(asRecord(data), "name"));
      const sql = await getSql();
      const display = await callerName(sql, SHARE_ID);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const id = crypto.randomUUID();
        const code = makeCode();
        try {
          await sql`
            with cal as (
              insert into calendars (id, name, invite_code, owner_id)
              values (${id}, ${name}, ${code}, ${SHARE_ID})
              returning id
            )
            insert into calendar_members (calendar_id, user_id, display_name, role)
            select id, ${SHARE_ID}, ${display}, 'owner' from cal
          `;
          return summaryFor(sql, id, SHARE_ID);
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (!/unique|duplicate|invite_code/i.test(message) || attempt === 4) {
            if (/unique|duplicate|invite_code/i.test(message)) {
              throw new UserError("달력을 만들지 못했습니다. 다시 시도해 주세요");
            }
            throw error;
          }
        }
      }
      throw new UserError("달력을 만들지 못했습니다. 다시 시도해 주세요");
    });
  });

export const joinCalendar = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<CalendarSummary>> => {
    return run(async () => {
      const raw = readString(asRecord(data), "code");
      const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length !== 6) throw new UserError("초대 코드 여섯 자리를 입력해 주세요");
      const sql = await getSql();
      const found = await sql<{ id: string }>`
        select id from calendars where invite_code = ${code} limit 1
      `;
      const calendarId = found[0]?.id;
      if (!calendarId) throw new UserError("초대 코드를 다시 확인해 주세요");
      const display = await callerName(sql, SHARE_ID);
      try {
        await sql`
          insert into calendar_members (calendar_id, user_id, display_name, role)
          values (${calendarId}, ${SHARE_ID}, ${display}, 'member')
        `;
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!/unique|duplicate/i.test(message)) throw error;
      }
      return summaryFor(sql, calendarId, SHARE_ID);
    });
  });

export const renameCalendar = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<CalendarSummary>> => {
    return run(async () => {
      const record = asRecord(data);
      const calendarId = assertId(readString(record, "calendarId"));
      const name = assertName(readString(record, "name"));
      const sql = await getSql();
      const role = await requireMember(sql, calendarId, SHARE_ID);
      if (role !== "owner") throw new UserError("달력 이름은 만든 사람만 바꿀 수 있습니다");
      await sql`update calendars set name = ${name} where id = ${calendarId}`;
      return summaryFor(sql, calendarId, SHARE_ID);
    });
  });

export const deleteCalendar = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    return run(async () => {
      const calendarId = assertId(readString(asRecord(data), "calendarId"));
      const sql = await getSql();
      const role = await requireMember(sql, calendarId, SHARE_ID);
      if (role !== "owner") throw new UserError("달력은 만든 사람만 지울 수 있습니다");
      const rows = await sql<{ id: string }>`
        delete from calendars where id = ${calendarId} and owner_id = ${SHARE_ID} returning id
      `;
      if (!rows[0]) throw new UserError("달력을 지우지 못했습니다");
      return { id: calendarId };
    });
  });

export const leaveCalendar = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    return run(async () => {
      const calendarId = assertId(readString(asRecord(data), "calendarId"));
      const sql = await getSql();
      const role = await requireMember(sql, calendarId, SHARE_ID);
      if (role === "owner") {
        throw new UserError("만든 사람은 나가기 대신 달력을 지울 수 있습니다");
      }
      await sql`
        delete from calendar_members
        where calendar_id = ${calendarId} and user_id = ${SHARE_ID}
      `;
      return { id: calendarId };
    });
  });

async function ensureCoverColumn(sql: Sql): Promise<void> {
  await sql`alter table calendars add column if not exists cover_image text`;
}

async function coverFor(sql: Sql, calendarId: string): Promise<string | null> {
  await ensureCoverColumn(sql);
  const rows = await sql<{ cover_image: string | null }>`
    select cover_image from calendars where id = ${calendarId} limit 1
  `;
  const value = rows[0]?.cover_image ?? null;
  return value && value.startsWith("data:image/") ? value : null;
}

function readCover(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new UserError("표지 이미지를 확인해 주세요");
  const image = value.replace(/\s/g, "");
  if (image.length > 900_000) throw new UserError("표지가 너무 커요. 더 작은 사진으로 올려 주세요");
  if (!/^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image)) {
    throw new UserError("jpg, png, webp 사진만 올릴 수 있어요");
  }
  return image;
}

export const setCover = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ coverImage: string | null }>> => {
    return run(async () => {
      const record = asRecord(data);
      const calendarId = assertId(readString(record, "calendarId"));
      const coverImage = readCover(record.image);
      const sql = await getSql();
      await requireMember(sql, calendarId, SHARE_ID);
      await sql`
        update calendars set cover_image = ${coverImage} where id = ${calendarId}
      `;
      return { coverImage };
    });
  });

export const loadMonth = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<MonthPayload>> => {
    return run(async () => {
      const record = asRecord(data);
      const calendarId = assertId(readString(record, "calendarId"));
      const from = assertYmd(readString(record, "from"));
      const to = assertYmd(readString(record, "to"));
      if (from > to) throw new UserError("날짜를 확인해 주세요");
      const span =
        (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
      if (span > 45) throw new UserError("날짜를 확인해 주세요");
      const sql = await getSql();
      const name = await callerName(sql, SHARE_ID);
      await syncName(sql, SHARE_ID, name);
      await requireMember(sql, calendarId, SHARE_ID);
      const calendar = await summaryFor(sql, calendarId, SHARE_ID);
      const members = await sql<{ user_id: string; display_name: string; role: string }>`
        select user_id, display_name, role
        from calendar_members
        where calendar_id = ${calendarId}
        order by case when role = 'owner' then 0 else 1 end, joined_at
      `;
      const events = await sql<EventRow>`
        select id, author_id, author_name, title, note, starts_on, start_time, end_time, all_day, tag
        from events
        where calendar_id = ${calendarId} and starts_on >= ${from} and starts_on <= ${to}
        order by starts_on, all_day desc, start_time nulls last, title
      `;
      const notes = await sql<NoteRow>`
        select id, author_id, author_name, day, body
        from day_notes
        where calendar_id = ${calendarId} and day >= ${from} and day <= ${to}
        order by created_at
      `;
      const memberList: Member[] = members.map((member) => ({
        userId: member.user_id,
        displayName: member.display_name,
        role: asRole(member.role),
      }));
      return {
        calendar,
        coverImage: await coverFor(sql, calendarId),
        members: memberList,
        events: events.map(mapEvent),
        notes: notes.map(mapNote),
      };
    });
  });

export const saveEvent = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<CalEvent>> => {
    return run(async () => {
      const record = asRecord(data);
      const editing = typeof record.id === "string" && record.id.length > 0;
      const input = readEventInput(data, editing);
      const sql = await getSql();
      await requireMember(sql, input.calendarId, SHARE_ID);
      const name = readWriters(record.writers);
      if (!editing) {
        const id = crypto.randomUUID();
        const rows = await sql<EventRow>`
          insert into events (
            id, calendar_id, author_id, author_name, title, note, starts_on,
            start_time, end_time, all_day, tag
          )
          values (
            ${id}, ${input.calendarId}, ${SHARE_ID}, ${name}, ${input.title},
            ${input.note}, ${input.startsOn}, ${input.startTime}, ${input.endTime},
            ${input.allDay}, ${input.tag}
          )
          returning id, author_id, author_name, title, note, starts_on, start_time, end_time, all_day, tag
        `;
        if (!rows[0]) throw new UserError("일정을 저장하지 못했습니다");
        return mapEvent(rows[0]);
      }
      const rows = await sql<EventRow>`
        update events
        set title = ${input.title},
            note = ${input.note},
            starts_on = ${input.startsOn},
            start_time = ${input.startTime},
            end_time = ${input.endTime},
            all_day = ${input.allDay},
            tag = ${input.tag},
            author_name = ${name},
            updated_at = now()
        where id = ${input.id!}
          and calendar_id = ${input.calendarId}
          and author_id = ${SHARE_ID}
        returning id, author_id, author_name, title, note, starts_on, start_time, end_time, all_day, tag
      `;
      if (!rows[0]) throw new UserError("본인이 적은 일정만 고칠 수 있습니다");
      return mapEvent(rows[0]);
    });
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    return run(async () => {
      const record = asRecord(data);
      const calendarId = assertId(readString(record, "calendarId"));
      const id = assertId(readString(record, "id"));
      const sql = await getSql();
      const role = await requireMember(sql, calendarId, SHARE_ID);
      const rows = await sql<{ id: string }>`
        delete from events
        where id = ${id}
          and calendar_id = ${calendarId}
          and (author_id = ${SHARE_ID} or ${role} = 'owner')
        returning id
      `;
      if (!rows[0]) throw new UserError("일정을 지우지 못했습니다");
      return { id };
    });
  });

export const saveNote = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<DayNote>> => {
    return run(async () => {
      const record = asRecord(data);
      const calendarId = assertId(readString(record, "calendarId"));
      const day = assertYmd(readString(record, "day"));
      const body = readString(record, "body").trim();
      if (body.length < 1 || body.length > 400) {
        throw new UserError("기록은 1자에서 400자까지 적어 주세요");
      }
      const sql = await getSql();
      await requireMember(sql, calendarId, SHARE_ID);
      const name = readWriters(record.writers);
      const id = crypto.randomUUID();
      const rows = await sql<NoteRow>`
        insert into day_notes (id, calendar_id, author_id, author_name, day, body)
        values (${id}, ${calendarId}, ${SHARE_ID}, ${name}, ${day}, ${body})
        returning id, author_id, author_name, day, body
      `;
      if (!rows[0]) throw new UserError("기록을 남기지 못했습니다");
      return mapNote(rows[0]);
    });
  });

export const deleteNote = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    return run(async () => {
      const record = asRecord(data);
      const calendarId = assertId(readString(record, "calendarId"));
      const id = assertId(readString(record, "id"));
      const sql = await getSql();
      const role = await requireMember(sql, calendarId, SHARE_ID);
      const rows = await sql<{ id: string }>`
        delete from day_notes
        where id = ${id}
          and calendar_id = ${calendarId}
          and (author_id = ${SHARE_ID} or ${role} = 'owner')
        returning id
      `;
      if (!rows[0]) throw new UserError("기록을 지우지 못했습니다");
      return { id };
    });
  });
