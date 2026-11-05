import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TAGS, t as CALENDAR_STORAGE_KEY } from "./types-2kGkb9PI.mjs";
import { _ as saveEvent, a as ShellSkeleton, c as UserButton, d as deleteNote, f as errText, g as renameCalendar, h as loadMonth, i as JoinCard, l as deleteCalendar, m as listCalendars, n as CreateCard, o as SignedOutLanding, p as leaveCalendar, r as Frame, s as StartLanding, t as AfterMount, u as deleteEvent, v as saveNote, y as useCurrentUserState } from "./chrome-XAKc5oIZ.mjs";
import { a as ChevronRight, i as Copy, n as Trash2, o as ChevronLeft, r as Pencil, s as Check } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BzAYDFcr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var WEEKDAYS = [
	"일",
	"월",
	"화",
	"수",
	"목",
	"금",
	"토"
];
function ymdFromParts(year, month0, day) {
	return `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function todayYmd(now = /* @__PURE__ */ new Date()) {
	return ymdFromParts(now.getFullYear(), now.getMonth(), now.getDate());
}
function parseYmd(value) {
	const year = Number(value.slice(0, 4));
	const month = Number(value.slice(5, 7));
	const day = Number(value.slice(8, 10));
	return new Date(year, month - 1, day);
}
function sameMonth(value, year, month0) {
	const date = parseYmd(value);
	return date.getFullYear() === year && date.getMonth() === month0;
}
function monthGrid(year, month0) {
	const first = new Date(year, month0, 1);
	const start = new Date(year, month0, 1 - first.getDay());
	const days = [];
	for (let i = 0; i < 42; i += 1) {
		const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
		days.push(ymdFromParts(date.getFullYear(), date.getMonth(), date.getDate()));
	}
	return days;
}
function shiftMonth(year, month0, delta) {
	const date = new Date(year, month0 + delta, 1);
	return {
		year: date.getFullYear(),
		month0: date.getMonth()
	};
}
function weekdayShort(value) {
	return WEEKDAYS[parseYmd(value).getDay()] ?? "";
}
function weekdayLong(value) {
	return `${weekdayShort(value)}요일`;
}
function dayNumber(value) {
	return parseYmd(value).getDate();
}
function monthTitle(year, month0) {
	return `${year}년 ${month0 + 1}월`;
}
function dayTitle(value) {
	const date = parseYmd(value);
	return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdayLong(value)}`;
}
var WEEKDAY_LABELS = WEEKDAYS;
function emptyDraft() {
	return {
		id: null,
		title: "",
		note: "",
		allDay: true,
		startTime: "09:00",
		endTime: "10:00",
		tag: "plan"
	};
}
function draftFrom(event) {
	return {
		id: event.id,
		title: event.title,
		note: event.note,
		allDay: event.allDay,
		startTime: event.startTime ?? "09:00",
		endTime: event.endTime ?? "10:00",
		tag: event.tag
	};
}
function whenLabel(event) {
	if (event.allDay) return "하루 종일";
	if (event.startTime && event.endTime) return `${event.startTime}–${event.endTime}`;
	return event.startTime ?? "시간 미정";
}
function TagMark({ tag, inverted }) {
	const fill = tag === "task" ? inverted ? "bg-on-pine" : "bg-mint" : tag === "mark" ? inverted ? "bg-on-pine" : "bg-butter" : tag === "memo" ? inverted ? "bg-on-pine" : "bg-rose" : inverted ? "bg-on-pine" : "bg-blush";
	if (tag === "task") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2 shrink-0 rounded-full border border-current ${inverted ? "text-on-pine" : "text-ink"}` });
	if (tag === "mark") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2 shrink-0 rotate-45 ${fill}` });
	if (tag === "memo") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-0.5 w-2 shrink-0 rounded-full ${fill}` });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2 shrink-0 rounded-full ${fill}` });
}
function eventsOn(events, day) {
	return events.filter((event) => event.startsOn === day);
}
function Workspace({ user, calendars, active, onSelect, onAdd, onPatch, onRemove }) {
	const today = (0, import_react.useMemo)(() => todayYmd(), []);
	const initial = (0, import_react.useMemo)(() => {
		const now = /* @__PURE__ */ new Date();
		return {
			year: now.getFullYear(),
			month0: now.getMonth()
		};
	}, []);
	const [year, setYear] = (0, import_react.useState)(initial.year);
	const [month0, setMonth0] = (0, import_react.useState)(initial.month0);
	const [selected, setSelected] = (0, import_react.useState)(today);
	const [payload, setPayload] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("");
	const [composer, setComposer] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [nameDraft, setNameDraft] = (0, import_react.useState)(active.name);
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)(emptyDraft);
	const [noteBody, setNoteBody] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)("");
	const seq = (0, import_react.useRef)(0);
	const copyTimer = (0, import_react.useRef)(null);
	const statusTimer = (0, import_react.useRef)(null);
	const menuRef = (0, import_react.useRef)(null);
	const days = (0, import_react.useMemo)(() => monthGrid(year, month0), [year, month0]);
	const from = days[0] ?? today;
	const to = days[days.length - 1] ?? today;
	(0, import_react.useEffect)(() => {
		setNameDraft(active.name);
		setConfirmDelete(false);
	}, [active.id, active.name]);
	(0, import_react.useEffect)(() => {
		setDraft(emptyDraft());
		setNoteBody("");
	}, [selected, active.id]);
	const refresh = (0, import_react.useCallback)(async () => {
		const token = ++seq.current;
		try {
			const result = await loadMonth({ data: {
				calendarId: active.id,
				from,
				to
			} });
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
	}, [
		active.id,
		from,
		to,
		onPatch
	]);
	(0, import_react.useEffect)(() => {
		refresh();
		const id = window.setInterval(() => {
			if (document.visibilityState === "visible") refresh();
		}, 8e3);
		const onVisible = () => {
			if (document.visibilityState === "visible") refresh();
		};
		document.addEventListener("visibilitychange", onVisible);
		return () => {
			window.clearInterval(id);
			document.removeEventListener("visibilitychange", onVisible);
		};
	}, [refresh]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (copyTimer.current) window.clearTimeout(copyTimer.current);
			if (statusTimer.current) window.clearTimeout(statusTimer.current);
		};
	}, []);
	function noteStatus(message) {
		setStatus(message);
		if (statusTimer.current) window.clearTimeout(statusTimer.current);
		statusTimer.current = window.setTimeout(() => setStatus(""), 2200);
	}
	function closeMenu() {
		if (menuRef.current) menuRef.current.open = false;
	}
	function moveMonth(delta) {
		const next = shiftMonth(year, month0, delta);
		const grid = monthGrid(next.year, next.month0);
		setYear(next.year);
		setMonth0(next.month0);
		if (!grid.includes(selected)) {
			const todayNow = todayYmd();
			const inMonth = grid.find((day) => sameMonth(day, next.year, next.month0));
			setSelected(grid.includes(todayNow) ? todayNow : inMonth ?? grid[0] ?? selected);
		}
	}
	function goToday() {
		const now = /* @__PURE__ */ new Date();
		setYear(now.getFullYear());
		setMonth0(now.getMonth());
		setSelected(todayYmd());
	}
	function chooseDay(day) {
		const date = new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
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
					block: "start"
				});
			});
		}
	}
	async function copyCode() {
		try {
			await navigator.clipboard.writeText(active.inviteCode);
			setCopied(true);
			if (copyTimer.current) window.clearTimeout(copyTimer.current);
			copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
		} catch {
			setError("복사에 실패했습니다. 코드를 길게 눌러 선택해 주세요.");
		}
	}
	async function onRename(event) {
		event.preventDefault();
		setSaving("meta");
		setError("");
		try {
			const result = await renameCalendar({ data: {
				calendarId: active.id,
				name: nameDraft
			} });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			onPatch(result.data);
			noteStatus("이름을 바꿨습니다");
			closeMenu();
		} catch (caught) {
			setError(errText(caught));
		} finally {
			setSaving("");
		}
	}
	async function onDeleteCalendar() {
		setSaving("meta");
		setError("");
		try {
			const result = await deleteCalendar({ data: { calendarId: active.id } });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			onRemove(active.id);
		} catch (caught) {
			setError(errText(caught));
		} finally {
			setSaving("");
		}
	}
	async function onLeave() {
		setSaving("meta");
		setError("");
		try {
			const result = await leaveCalendar({ data: { calendarId: active.id } });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			onRemove(active.id);
		} catch (caught) {
			setError(errText(caught));
		} finally {
			setSaving("");
		}
	}
	async function onSaveEvent(event) {
		event.preventDefault();
		setSaving("event");
		setError("");
		try {
			const result = await saveEvent({ data: {
				id: draft.id ?? "",
				calendarId: active.id,
				title: draft.title,
				note: draft.note,
				startsOn: selected,
				allDay: draft.allDay,
				startTime: draft.allDay ? "" : draft.startTime,
				endTime: draft.allDay ? "" : draft.endTime,
				tag: draft.tag
			} });
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
	async function onDeleteEvent(id) {
		setError("");
		try {
			const result = await deleteEvent({ data: {
				calendarId: active.id,
				id
			} });
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
	async function onSaveNote(event) {
		event.preventDefault();
		setSaving("note");
		setError("");
		try {
			const result = await saveNote({ data: {
				calendarId: active.id,
				day: selected,
				body: noteBody
			} });
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
	async function onDeleteNote(id) {
		setError("");
		try {
			const result = await deleteNote({ data: {
				calendarId: active.id,
				id
			} });
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, {
		trailing: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "truncate font-display text-3xl leading-none",
							children: active.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: members.length <= 1 ? "아직 혼자 쓰는 달력입니다. 초대 코드를 보내 보세요." : members.map((member) => member.displayName).join(" · ")
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ring-line flex items-center gap-2 rounded-full bg-paper-2 py-1 pr-1 pl-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-muted",
									children: "초대"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-sm tracking-widest",
									children: active.inviteCode
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "press inline-flex h-11 items-center gap-1 rounded-full bg-card px-3 text-sm font-medium",
									onClick: () => void copyCode(),
									children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										className: "size-4",
										"aria-hidden": true
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
										className: "size-4",
										"aria-hidden": true
									}), copied ? "복사됨" : "복사"]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							ref: menuRef,
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
								className: "plain press ring-line flex h-11 items-center rounded-full bg-card px-4 text-sm font-medium",
								children: "관리"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel absolute right-0 z-30 mt-2 w-64 rounded-2xl p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: onRename,
									className: "grid gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "grid gap-1 text-sm font-medium",
										htmlFor: "rename-calendar",
										children: ["달력 이름", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "rename-calendar",
											className: "field font-normal",
											value: nameDraft,
											maxLength: 40,
											disabled: active.role !== "owner",
											onChange: (event) => setNameDraft(event.target.value)
										})]
									}), active.role === "owner" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										className: "press h-11 bg-pine text-sm font-medium text-on-pine disabled:opacity-50",
										disabled: saving === "meta",
										children: "이름 저장"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: "이름은 만든 사람만 바꿉니다."
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 border-t border-line pt-3",
									children: active.role === "owner" ? confirmDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm",
												children: "일정과 기록이 모두 지워집니다."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "press h-11 bg-rose text-sm font-medium text-on-pine disabled:opacity-50",
												disabled: saving === "meta",
												onClick: () => void onDeleteCalendar(),
												children: "달력 지우기"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "press h-11 text-sm text-muted",
												onClick: () => setConfirmDelete(false),
												children: "취소"
											})
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "press h-11 w-full rounded-lg text-sm font-medium",
										onClick: () => setConfirmDelete(true),
										children: "달력 지우기"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "press h-11 w-full rounded-lg text-sm font-medium disabled:opacity-50",
										disabled: saving === "meta",
										onClick: () => void onLeave(),
										children: "이 달력에서 나가기"
									})
								})]
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 overflow-x-auto pb-1",
					children: [
						calendars.map((calendar) => {
							const current = calendar.id === active.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": current,
								onClick: () => onSelect(calendar.id),
								className: `press h-11 max-w-40 shrink-0 truncate rounded-full px-4 text-sm font-medium ${current ? "bg-pine text-on-pine" : "bg-paper-2 text-ink"}`,
								children: calendar.name
							}, calendar.id);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "press h-11 shrink-0 rounded-full bg-paper-2 px-4 text-sm font-medium",
							onClick: () => setComposer((value) => value === "create" ? null : "create"),
							children: "새 달력"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "press h-11 shrink-0 rounded-full bg-paper-2 px-4 text-sm font-medium",
							onClick: () => setComposer((value) => value === "join" ? null : "join"),
							children: "코드로 참여"
						})
					]
				}),
				composer === "create" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateCard, {
					onCreated: onAdd,
					onCancel: () => setComposer(null)
				}) : null,
				composer === "join" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JoinCard, {
					onJoined: onAdd,
					onCancel: () => setComposer(null)
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "rounded-lg bg-paper-2 px-3 py-2 text-sm",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "sr-only",
					"aria-live": "polite",
					children: status
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid items-start gap-4 lg:grid-cols-[minmax(0,1.45fr)_22rem]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel rounded-3xl p-3 md:p-4",
						"aria-label": "월간 달력",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-2 flex items-center justify-between gap-2 px-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "press grid size-11 place-items-center rounded-full hover:bg-paper-2",
										"aria-label": "이전 달",
										onClick: () => moveMonth(-1),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
											className: "size-5",
											"aria-hidden": true
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "min-w-36 text-center font-display text-3xl font-medium tabular-nums",
										children: monthTitle(year, month0)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "press grid size-11 place-items-center rounded-full hover:bg-paper-2",
										"aria-label": "다음 달",
										onClick: () => moveMonth(1),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
											className: "size-5",
											"aria-hidden": true
										})
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "press h-11 rounded-full px-4 text-sm font-medium text-pine",
								onClick: goToday,
								children: "오늘"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-7 gap-1",
							children: [WEEKDAY_LABELS.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `py-2 text-center text-xs font-medium ${index === 0 ? "text-pine" : "text-muted"}`,
								children: label
							}, label)), days.map((day) => {
								const inMonth = sameMonth(day, year, month0);
								const isSelected = day === selected;
								const isToday = day === today;
								const cellEvents = eventsOn(events, day);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-pressed": isSelected,
									"aria-current": isToday ? "date" : void 0,
									"aria-label": `${dayTitle(day)}, 일정 ${cellEvents.length}개${isToday ? ", 오늘" : ""}`,
									onClick: () => chooseDay(day),
									className: `press flex min-h-14 flex-col items-center gap-1 rounded-2xl px-1 py-2 md:min-h-24 md:items-stretch ${isSelected ? "bg-pine text-on-pine" : isToday ? "bg-butter text-ink" : "text-ink hover:bg-paper-2"} ${inMonth ? "" : "opacity-45"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-medium tabular-nums",
											children: dayNumber(day)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex h-2 items-center gap-0.5 md:hidden",
											children: cellEvents.slice(0, 3).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TagMark, {
												tag: item.tag,
												inverted: isSelected
											}, item.id))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "mt-1 hidden flex-col gap-0.5 md:flex",
											children: [cellEvents.slice(0, 2).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1 text-left text-xs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TagMark, {
													tag: item.tag,
													inverted: isSelected
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "truncate",
													children: item.title
												})]
											}, item.id)), cellEvents.length > 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs tabular-nums",
												children: ["+", cellEvents.length - 2]
											}) : null]
										})
									]
								}, day);
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "day-panel",
						className: "panel rise rounded-3xl p-4",
						"aria-label": "선택한 날",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs font-medium text-muted",
								children: [weekdayShort(selected), "요일"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-3xl font-medium tabular-nums",
								children: dayNumber(selected)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: dayTitle(selected)
							}),
							status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-pine",
								children: status
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: onSaveEvent,
								className: "mt-4 grid gap-3 border-t border-line pt-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-sm font-medium",
											children: draft.id ? "일정 고치기" : "일정"
										}), draft.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "text-sm text-muted",
											onClick: () => setDraft(emptyDraft()),
											children: "취소"
										}) : null]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "sr-only",
										htmlFor: "event-title",
										children: "일정 제목"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "event-title",
										className: "field",
										value: draft.title,
										maxLength: 80,
										placeholder: "점심, 회의, 생일",
										onChange: (event) => setDraft((prev) => ({
											...prev,
											title: event.target.value
										})),
										required: true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										role: "radiogroup",
										"aria-label": "일정 종류",
										children: TAGS.map((tag) => {
											const on = draft.tag === tag.id;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												role: "radio",
												"aria-checked": on,
												className: `press inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm ${on ? "bg-pine text-on-pine" : "bg-paper-2 text-ink"}`,
												onClick: () => setDraft((prev) => ({
													...prev,
													tag: tag.id
												})),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TagMark, {
													tag: tag.id,
													inverted: on
												}), tag.label]
											}, tag.id);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "press h-11 justify-self-start rounded-lg px-1 text-sm font-medium text-pine",
										"aria-pressed": draft.allDay,
										onClick: () => setDraft((prev) => ({
											...prev,
											allDay: !prev.allDay
										})),
										children: draft.allDay ? "하루 종일" : "시간 지정"
									}),
									draft.allDay ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "grid gap-1 text-xs font-medium text-muted",
											htmlFor: "start-time",
											children: ["시작", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												id: "start-time",
												type: "time",
												className: "field",
												value: draft.startTime,
												onChange: (event) => setDraft((prev) => ({
													...prev,
													startTime: event.target.value
												})),
												required: true
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "grid gap-1 text-xs font-medium text-muted",
											htmlFor: "end-time",
											children: ["끝", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												id: "end-time",
												type: "time",
												className: "field",
												value: draft.endTime,
												onChange: (event) => setDraft((prev) => ({
													...prev,
													endTime: event.target.value
												}))
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "sr-only",
										htmlFor: "event-note",
										children: "일정 메모"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										id: "event-note",
										className: "field",
										value: draft.note,
										maxLength: 500,
										placeholder: "장소나 준비물",
										onChange: (event) => setDraft((prev) => ({
											...prev,
											note: event.target.value
										}))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										className: "press h-11 rounded-lg bg-pine text-sm font-medium text-on-pine hover:bg-pine-hover disabled:opacity-50",
										disabled: saving === "event",
										children: saving === "event" ? "저장 중" : draft.id ? "일정 저장" : "일정 추가"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 grid gap-2",
								children: !ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { className: "h-16 animate-pulse rounded-xl bg-paper-2" }) : dayEvents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "text-sm text-muted",
									children: "이 날의 일정이 없습니다."
								}) : dayEvents.map((item) => {
									const mine = item.authorId === user.id;
									const canDelete = mine || active.role === "owner";
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "rounded-xl bg-paper px-3 py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "flex items-center gap-2 font-medium",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TagMark, { tag: item.tag }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "truncate",
															children: item.title
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "mt-1 text-sm text-muted",
														children: [
															whenLabel(item),
															" · ",
															item.authorName
														]
													}),
													item.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-1 text-sm",
														children: item.note
													}) : null
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex shrink-0",
												children: [mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "press grid size-11 place-items-center rounded-full text-muted hover:bg-paper-2",
													"aria-label": `${item.title} 수정`,
													onClick: () => setDraft(draftFrom(item)),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {
														className: "size-4",
														"aria-hidden": true
													})
												}) : null, canDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "press grid size-11 place-items-center rounded-full text-muted hover:bg-paper-2",
													"aria-label": `${item.title} 지우기`,
													onClick: () => void onDeleteEvent(item.id),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
														className: "size-4",
														"aria-hidden": true
													})
												}) : null]
											})]
										})
									}, item.id);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: onSaveNote,
								className: "mt-6 grid gap-3 border-t border-line pt-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-medium",
										children: "함께 기록"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "sr-only",
										htmlFor: "day-note",
										children: "하루 기록"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										id: "day-note",
										className: "field",
										value: noteBody,
										maxLength: 400,
										placeholder: "오늘 있었던 일을 짧게 남겨 주세요",
										onChange: (event) => setNoteBody(event.target.value),
										required: true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										className: "press h-11 bg-mint text-sm font-medium text-ink disabled:opacity-50",
										disabled: saving === "note",
										children: saving === "note" ? "남기는 중" : "기록 남기기"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 grid gap-2",
								children: ready && notes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "text-sm text-muted",
									children: "아직 기록이 없습니다."
								}) : notes.map((note) => {
									const canDelete = note.authorId === user.id || active.role === "owner";
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "rounded-xl bg-paper px-3 py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm",
													children: note.body
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1 text-xs text-muted",
													children: note.authorName
												})]
											}), canDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "press grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-paper-2",
												"aria-label": "기록 지우기",
												onClick: () => void onDeleteNote(note.id),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
													className: "size-4",
													"aria-hidden": true
												})
											}) : null]
										})
									}, note.id);
								})
							})
						]
					})]
				})
			]
		})
	});
}
function WorkspaceGate({ user }) {
	const [calendars, setCalendars] = (0, import_react.useState)(null);
	const [activeId, setActiveId] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const reload = (0, import_react.useCallback)(async () => {
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
	(0, import_react.useEffect)(() => {
		reload();
	}, [reload]);
	(0, import_react.useEffect)(() => {
		if (activeId) localStorage.setItem(CALENDAR_STORAGE_KEY, activeId);
	}, [activeId]);
	(0, import_react.useEffect)(() => {
		if (!calendars || calendars.length === 0) return;
		if (activeId && calendars.some((item) => item.id === activeId)) return;
		setActiveId(calendars[0]?.id ?? null);
	}, [calendars, activeId]);
	const add = (0, import_react.useCallback)((calendar) => {
		setCalendars((prev) => [calendar, ...(prev ?? []).filter((item) => item.id !== calendar.id)]);
		setActiveId(calendar.id);
	}, []);
	const patch = (0, import_react.useCallback)((calendar) => {
		setCalendars((prev) => {
			if (!prev) return prev;
			const current = prev.find((item) => item.id === calendar.id);
			if (current && current.name === calendar.name && current.inviteCode === calendar.inviteCode && current.role === calendar.role && current.memberCount === calendar.memberCount) return prev;
			return prev.map((item) => item.id === calendar.id ? calendar : item);
		});
	}, []);
	const remove = (0, import_react.useCallback)((id) => {
		setCalendars((prev) => (prev ?? []).filter((item) => item.id !== id));
		setActiveId((current) => current === id ? null : current);
	}, []);
	if (!calendars) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {});
	if (error && calendars.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, {
		trailing: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-md gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl leading-tight",
					children: "달력을 열지 못했습니다"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "press h-11 bg-pine px-4 text-sm font-medium text-on-pine",
					onClick: () => {
						setCalendars(null);
						reload();
					},
					children: "다시 시도"
				})
			]
		})
	});
	if (calendars.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartLanding, { onReady: add });
	const active = calendars.find((item) => item.id === activeId) ?? calendars[0];
	if (!active) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartLanding, { onReady: add });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workspace, {
		user,
		calendars,
		active,
		onSelect: setActiveId,
		onAdd: add,
		onPatch: patch,
		onRemove: remove
	});
}
function HomeReady() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOutLanding, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkspaceGate, { user });
}
function CalendarScreen() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AfterMount, {
		fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeReady, {})
	});
}
var SplitComponent = CalendarScreen;
//#endregion
export { SplitComponent as component };
