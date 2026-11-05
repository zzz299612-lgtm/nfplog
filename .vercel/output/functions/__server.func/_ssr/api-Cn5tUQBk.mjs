import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { r as getSql } from "./db-BefjnPli.mjs";
import { t as authMiddleware } from "./middleware-FpX0v3bX.mjs";
import { r as isTag } from "./types-2kGkb9PI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-Cn5tUQBk.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var UserError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "UserError";
	}
};
async function run(fn) {
	try {
		return {
			ok: true,
			data: await fn()
		};
	} catch (error) {
		if (error instanceof UserError) return {
			ok: false,
			error: error.message
		};
		throw error;
	}
}
function asRecord(input) {
	if (!input || typeof input !== "object") throw new UserError("요청을 확인해 주세요");
	return input;
}
function readString(record, key) {
	const value = record[key];
	return typeof value === "string" ? value : "";
}
function assertId(value) {
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new UserError("요청을 확인해 주세요");
	return value;
}
function assertYmd(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new UserError("날짜를 확인해 주세요");
	const year = Number(value.slice(0, 4));
	const month = Number(value.slice(5, 7));
	const day = Number(value.slice(8, 10));
	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new UserError("날짜를 확인해 주세요");
	return value;
}
function assertTime(value, required) {
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
function assertName(value) {
	const name = value.trim().replace(/\s+/g, " ");
	if (name.length < 1 || name.length > 40) throw new UserError("달력 이름은 1자에서 40자까지 적어 주세요");
	return name;
}
function makeCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	const bytes = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(6));
	let code = "";
	for (const byte of bytes) code += alphabet[byte % 32];
	return code;
}
function asRole(value) {
	if (value !== "owner" && value !== "member") throw new UserError("이 달력을 찾을 수 없습니다");
	return value;
}
function mapSummary(row) {
	return {
		id: row.id,
		name: row.name,
		inviteCode: row.invite_code,
		role: asRole(row.role),
		memberCount: Number(row.member_count)
	};
}
var summarySelect = `
  select c.id, c.name, c.invite_code, m.role,
    (select count(*)::int from calendar_members mm where mm.calendar_id = c.id) as member_count
  from calendars c
  join calendar_members m on m.calendar_id = c.id
`;
async function callerName(sql, userId) {
	const name = (await sql`
    select "name" as name from "user" where "id" = ${userId} limit 1
  `)[0]?.name?.trim() ?? "";
	return name ? name.slice(0, 40) : "멤버";
}
async function syncName(sql, userId, name) {
	await sql`
    update calendar_members set display_name = ${name}
    where user_id = ${userId} and display_name <> ${name}
  `;
	await sql`
    update events set author_name = ${name}
    where author_id = ${userId} and author_name <> ${name}
  `;
	await sql`
    update day_notes set author_name = ${name}
    where author_id = ${userId} and author_name <> ${name}
  `;
}
async function requireMember(sql, calendarId, userId) {
	const rows = await sql`
    select role from calendar_members
    where calendar_id = ${calendarId} and user_id = ${userId}
    limit 1
  `;
	if (!rows[0]) throw new UserError("이 달력을 찾을 수 없습니다");
	return asRole(rows[0].role);
}
async function summaryFor(sql, calendarId, userId) {
	const rows = await sql`
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
function mapEvent(row) {
	const tag = isTag(row.tag) ? row.tag : "plan";
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
		tag
	};
}
function mapNote(row) {
	return {
		id: row.id,
		authorId: row.author_id,
		authorName: row.author_name,
		day: String(row.day).slice(0, 10),
		body: row.body
	};
}
function readEventInput(input, withId) {
	const record = asRecord(input);
	const calendarId = assertId(readString(record, "calendarId"));
	const title = readString(record, "title").trim().replace(/\s+/g, " ");
	if (title.length < 1 || title.length > 80) throw new UserError("일정 제목은 1자에서 80자까지 적어 주세요");
	const note = readString(record, "note").trim();
	if (note.length > 500) throw new UserError("메모는 500자까지 적을 수 있습니다");
	const startsOn = assertYmd(readString(record, "startsOn"));
	const allDay = record.allDay !== false;
	const startTime = assertTime(readString(record, "startTime").trim() || null, !allDay);
	const endTime = assertTime(readString(record, "endTime").trim() || null, false);
	if (!allDay && startTime && endTime && endTime < startTime) throw new UserError("끝나는 시간이 시작보다 빠릅니다");
	const tagRaw = readString(record, "tag");
	if (!isTag(tagRaw)) throw new UserError("일정 종류를 선택해 주세요");
	const parsed = {
		calendarId,
		title,
		note,
		startsOn,
		allDay,
		startTime: allDay ? null : startTime,
		endTime: allDay ? null : endTime,
		tag: tagRaw
	};
	if (withId) parsed.id = assertId(readString(record, "id"));
	return parsed;
}
var listCalendars_createServerFn_handler = createServerRpc({
	id: "75ab6f352c5a4e30d7195dc21ef5560ecda5d1e66caefabe7d9213f69bc18831",
	name: "listCalendars",
	filename: "src/lib/calendar/api.ts"
}, (opts) => listCalendars.__executeServer(opts));
var listCalendars = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listCalendars_createServerFn_handler, async ({ context }) => {
	return run(async () => {
		const sql = await getSql();
		const name = await callerName(sql, context.userId);
		await syncName(sql, context.userId, name);
		return (await sql.query(`${summarySelect} where m.user_id = $1 order by c.created_at desc`, [context.userId])).map(mapSummary);
	});
});
var createCalendar_createServerFn_handler = createServerRpc({
	id: "ec83263c019020945ae82c06225183f6ba573ef55d5925e1ec1b5d91275fe189",
	name: "createCalendar",
	filename: "src/lib/calendar/api.ts"
}, (opts) => createCalendar.__executeServer(opts));
var createCalendar = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createCalendar_createServerFn_handler, async ({ context, data }) => {
	return run(async () => {
		const name = assertName(readString(asRecord(data), "name"));
		const sql = await getSql();
		const display = await callerName(sql, context.userId);
		for (let attempt = 0; attempt < 5; attempt += 1) {
			const id = crypto.randomUUID();
			const code = makeCode();
			try {
				await sql`
            with cal as (
              insert into calendars (id, name, invite_code, owner_id)
              values (${id}, ${name}, ${code}, ${context.userId})
              returning id
            )
            insert into calendar_members (calendar_id, user_id, display_name, role)
            select id, ${context.userId}, ${display}, 'owner' from cal
          `;
				return summaryFor(sql, id, context.userId);
			} catch (error) {
				const message = error instanceof Error ? error.message : "";
				if (!/unique|duplicate|invite_code/i.test(message) || attempt === 4) {
					if (/unique|duplicate|invite_code/i.test(message)) throw new UserError("달력을 만들지 못했습니다. 다시 시도해 주세요");
					throw error;
				}
			}
		}
		throw new UserError("달력을 만들지 못했습니다. 다시 시도해 주세요");
	});
});
var joinCalendar_createServerFn_handler = createServerRpc({
	id: "e7cffe54ed99562e365c8803f22f9114ab11336cc3aa7f5f8cd785526a479d22",
	name: "joinCalendar",
	filename: "src/lib/calendar/api.ts"
}, (opts) => joinCalendar.__executeServer(opts));
var joinCalendar = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(joinCalendar_createServerFn_handler, async ({ context, data }) => {
	return run(async () => {
		const code = readString(asRecord(data), "code").toUpperCase().replace(/[^A-Z0-9]/g, "");
		if (code.length !== 6) throw new UserError("초대 코드 여섯 자리를 입력해 주세요");
		const sql = await getSql();
		const calendarId = (await sql`
        select id from calendars where invite_code = ${code} limit 1
      `)[0]?.id;
		if (!calendarId) throw new UserError("초대 코드를 다시 확인해 주세요");
		const display = await callerName(sql, context.userId);
		try {
			await sql`
          insert into calendar_members (calendar_id, user_id, display_name, role)
          values (${calendarId}, ${context.userId}, ${display}, 'member')
        `;
		} catch (error) {
			const message = error instanceof Error ? error.message : "";
			if (!/unique|duplicate/i.test(message)) throw error;
		}
		return summaryFor(sql, calendarId, context.userId);
	});
});
var renameCalendar_createServerFn_handler = createServerRpc({
	id: "55e1d3d3423e03016a8c29f26eb57f7c87503c9e67f3113aaec8c7544409c30a",
	name: "renameCalendar",
	filename: "src/lib/calendar/api.ts"
}, (opts) => renameCalendar.__executeServer(opts));
var renameCalendar = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(renameCalendar_createServerFn_handler, async ({ context, data }) => {
	return run(async () => {
		const record = asRecord(data);
		const calendarId = assertId(readString(record, "calendarId"));
		const name = assertName(readString(record, "name"));
		const sql = await getSql();
		if (await requireMember(sql, calendarId, context.userId) !== "owner") throw new UserError("달력 이름은 만든 사람만 바꿀 수 있습니다");
		await sql`update calendars set name = ${name} where id = ${calendarId}`;
		return summaryFor(sql, calendarId, context.userId);
	});
});
var deleteCalendar_createServerFn_handler = createServerRpc({
	id: "807e0389e56f48c830b0d0510cffcf753beda5e9bb2edf4d5a142fcbd89a366b",
	name: "deleteCalendar",
	filename: "src/lib/calendar/api.ts"
}, (opts) => deleteCalendar.__executeServer(opts));
var deleteCalendar = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(deleteCalendar_createServerFn_handler, async ({ context, data }) => {
	return run(async () => {
		const calendarId = assertId(readString(asRecord(data), "calendarId"));
		const sql = await getSql();
		if (await requireMember(sql, calendarId, context.userId) !== "owner") throw new UserError("달력은 만든 사람만 지울 수 있습니다");
		if (!(await sql`
        delete from calendars where id = ${calendarId} and owner_id = ${context.userId} returning id
      `)[0]) throw new UserError("달력을 지우지 못했습니다");
		return { id: calendarId };
	});
});
var leaveCalendar_createServerFn_handler = createServerRpc({
	id: "bd88484f14ab5615374955a1698fd931678be38a88dcf97a898b6c078a9ccc22",
	name: "leaveCalendar",
	filename: "src/lib/calendar/api.ts"
}, (opts) => leaveCalendar.__executeServer(opts));
var leaveCalendar = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(leaveCalendar_createServerFn_handler, async ({ context, data }) => {
	return run(async () => {
		const calendarId = assertId(readString(asRecord(data), "calendarId"));
		const sql = await getSql();
		if (await requireMember(sql, calendarId, context.userId) === "owner") throw new UserError("만든 사람은 나가기 대신 달력을 지울 수 있습니다");
		await sql`
        delete from calendar_members
        where calendar_id = ${calendarId} and user_id = ${context.userId}
      `;
		return { id: calendarId };
	});
});
var loadMonth_createServerFn_handler = createServerRpc({
	id: "65455d48f884bdaf645cedd11eea4eed07a712359fd403ff43657cd6831d422c",
	name: "loadMonth",
	filename: "src/lib/calendar/api.ts"
}, (opts) => loadMonth.__executeServer(opts));
var loadMonth = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(loadMonth_createServerFn_handler, async ({ context, data }) => {
	return run(async () => {
		const record = asRecord(data);
		const calendarId = assertId(readString(record, "calendarId"));
		const from = assertYmd(readString(record, "from"));
		const to = assertYmd(readString(record, "to"));
		if (from > to) throw new UserError("날짜를 확인해 주세요");
		if ((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5 > 45) throw new UserError("날짜를 확인해 주세요");
		const sql = await getSql();
		const name = await callerName(sql, context.userId);
		await syncName(sql, context.userId, name);
		await requireMember(sql, calendarId, context.userId);
		const calendar = await summaryFor(sql, calendarId, context.userId);
		const members = await sql`
        select user_id, display_name, role
        from calendar_members
        where calendar_id = ${calendarId}
        order by case when role = 'owner' then 0 else 1 end, joined_at
      `;
		const events = await sql`
        select id, author_id, author_name, title, note, starts_on, start_time, end_time, all_day, tag
        from events
        where calendar_id = ${calendarId} and starts_on >= ${from} and starts_on <= ${to}
        order by starts_on, all_day desc, start_time nulls last, title
      `;
		const notes = await sql`
        select id, author_id, author_name, day, body
        from day_notes
        where calendar_id = ${calendarId} and day >= ${from} and day <= ${to}
        order by created_at
      `;
		return {
			calendar,
			members: members.map((member) => ({
				userId: member.user_id,
				displayName: member.display_name,
				role: asRole(member.role)
			})),
			events: events.map(mapEvent),
			notes: notes.map(mapNote)
		};
	});
});
var saveEvent_createServerFn_handler = createServerRpc({
	id: "a0a5b27d074b4f790550755b94ae5050dedec2b3eee18a7c0b0625472f92ac51",
	name: "saveEvent",
	filename: "src/lib/calendar/api.ts"
}, (opts) => saveEvent.__executeServer(opts));
var saveEvent = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(saveEvent_createServerFn_handler, async ({ context, data }) => {
	return run(async () => {
		const record = asRecord(data);
		const editing = typeof record.id === "string" && record.id.length > 0;
		const input = readEventInput(data, editing);
		const sql = await getSql();
		await requireMember(sql, input.calendarId, context.userId);
		const name = await callerName(sql, context.userId);
		if (!editing) {
			const rows = await sql`
          insert into events (
            id, calendar_id, author_id, author_name, title, note, starts_on,
            start_time, end_time, all_day, tag
          )
          values (
            ${crypto.randomUUID()}, ${input.calendarId}, ${context.userId}, ${name}, ${input.title},
            ${input.note}, ${input.startsOn}, ${input.startTime}, ${input.endTime},
            ${input.allDay}, ${input.tag}
          )
          returning id, author_id, author_name, title, note, starts_on, start_time, end_time, all_day, tag
        `;
			if (!rows[0]) throw new UserError("일정을 저장하지 못했습니다");
			return mapEvent(rows[0]);
		}
		const rows = await sql`
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
        where id = ${input.id}
          and calendar_id = ${input.calendarId}
          and author_id = ${context.userId}
        returning id, author_id, author_name, title, note, starts_on, start_time, end_time, all_day, tag
      `;
		if (!rows[0]) throw new UserError("본인이 적은 일정만 고칠 수 있습니다");
		return mapEvent(rows[0]);
	});
});
var deleteEvent_createServerFn_handler = createServerRpc({
	id: "b73f8562b92e2c8d8eb6715fbb25d72d126d8185f0b8d2c1622038098fc7bf32",
	name: "deleteEvent",
	filename: "src/lib/calendar/api.ts"
}, (opts) => deleteEvent.__executeServer(opts));
var deleteEvent = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(deleteEvent_createServerFn_handler, async ({ context, data }) => {
	return run(async () => {
		const record = asRecord(data);
		const calendarId = assertId(readString(record, "calendarId"));
		const id = assertId(readString(record, "id"));
		const sql = await getSql();
		const role = await requireMember(sql, calendarId, context.userId);
		if (!(await sql`
        delete from events
        where id = ${id}
          and calendar_id = ${calendarId}
          and (author_id = ${context.userId} or ${role} = 'owner')
        returning id
      `)[0]) throw new UserError("일정을 지우지 못했습니다");
		return { id };
	});
});
var saveNote_createServerFn_handler = createServerRpc({
	id: "85098a510786b966116d15fdeacb030309a9304baf1d68b57401589b0b4ac06f",
	name: "saveNote",
	filename: "src/lib/calendar/api.ts"
}, (opts) => saveNote.__executeServer(opts));
var saveNote = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(saveNote_createServerFn_handler, async ({ context, data }) => {
	return run(async () => {
		const record = asRecord(data);
		const calendarId = assertId(readString(record, "calendarId"));
		const day = assertYmd(readString(record, "day"));
		const body = readString(record, "body").trim();
		if (body.length < 1 || body.length > 400) throw new UserError("기록은 1자에서 400자까지 적어 주세요");
		const sql = await getSql();
		await requireMember(sql, calendarId, context.userId);
		const name = await callerName(sql, context.userId);
		const rows = await sql`
        insert into day_notes (id, calendar_id, author_id, author_name, day, body)
        values (${crypto.randomUUID()}, ${calendarId}, ${context.userId}, ${name}, ${day}, ${body})
        returning id, author_id, author_name, day, body
      `;
		if (!rows[0]) throw new UserError("기록을 남기지 못했습니다");
		return mapNote(rows[0]);
	});
});
var deleteNote_createServerFn_handler = createServerRpc({
	id: "3ca09404dfe0d30dd8ad6f2e7dfa0e3e4f081957de92b53ed16a9a1d944107c5",
	name: "deleteNote",
	filename: "src/lib/calendar/api.ts"
}, (opts) => deleteNote.__executeServer(opts));
var deleteNote = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(deleteNote_createServerFn_handler, async ({ context, data }) => {
	return run(async () => {
		const record = asRecord(data);
		const calendarId = assertId(readString(record, "calendarId"));
		const id = assertId(readString(record, "id"));
		const sql = await getSql();
		const role = await requireMember(sql, calendarId, context.userId);
		if (!(await sql`
        delete from day_notes
        where id = ${id}
          and calendar_id = ${calendarId}
          and (author_id = ${context.userId} or ${role} = 'owner')
        returning id
      `)[0]) throw new UserError("기록을 지우지 못했습니다");
		return { id };
	});
});
//#endregion
export { createCalendar_createServerFn_handler, deleteCalendar_createServerFn_handler, deleteEvent_createServerFn_handler, deleteNote_createServerFn_handler, joinCalendar_createServerFn_handler, leaveCalendar_createServerFn_handler, listCalendars_createServerFn_handler, loadMonth_createServerFn_handler, renameCalendar_createServerFn_handler, saveEvent_createServerFn_handler, saveNote_createServerFn_handler };
