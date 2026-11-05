import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-FpX0v3bX.mjs";
import { i as signOut, r as signIn, t as authClient } from "./client-1vAx-gM_.mjs";
import { a as hasGateSessionMarker, t as GROK_PROVIDERS } from "./server-Bl4fx75j.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chrome-XAKc5oIZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	return useSessionUserState();
}
function useSessionUserState() {
	const { data, isPending } = authClient.useSession();
	const id = data?.user.id;
	const displayName = data?.user.name ?? null;
	const primaryEmail = data?.user.email ?? null;
	const profileImageUrl = data?.user.image ?? null;
	const user = (0, import_react.useMemo)(() => id ? {
		id,
		displayName,
		primaryEmail,
		profileImageUrl,
		isDevFallback: false
	} : null, [
		id,
		displayName,
		primaryEmail,
		profileImageUrl
	]);
	return (0, import_react.useMemo)(() => ({
		user,
		isPending
	}), [user, isPending]);
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var listCalendars = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("75ab6f352c5a4e30d7195dc21ef5560ecda5d1e66caefabe7d9213f69bc18831"));
var createCalendar = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("ec83263c019020945ae82c06225183f6ba573ef55d5925e1ec1b5d91275fe189"));
var joinCalendar = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("e7cffe54ed99562e365c8803f22f9114ab11336cc3aa7f5f8cd785526a479d22"));
var renameCalendar = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("55e1d3d3423e03016a8c29f26eb57f7c87503c9e67f3113aaec8c7544409c30a"));
var deleteCalendar = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("807e0389e56f48c830b0d0510cffcf753beda5e9bb2edf4d5a142fcbd89a366b"));
var leaveCalendar = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("bd88484f14ab5615374955a1698fd931678be38a88dcf97a898b6c078a9ccc22"));
var loadMonth = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("65455d48f884bdaf645cedd11eea4eed07a712359fd403ff43657cd6831d422c"));
var saveEvent = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("a0a5b27d074b4f790550755b94ae5050dedec2b3eee18a7c0b0625472f92ac51"));
var deleteEvent = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("b73f8562b92e2c8d8eb6715fbb25d72d126d8185f0b8d2c1622038098fc7bf32"));
var saveNote = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("85098a510786b966116d15fdeacb030309a9304baf1d68b57401589b0b4ac06f"));
var deleteNote = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("3ca09404dfe0d30dd8ad6f2e7dfa0e3e4f081957de92b53ed16a9a1d944107c5"));
function errText(error) {
	const message = error instanceof Error ? error.message : "";
	if (message === "Unauthorized") return "로그인이 필요합니다";
	if (!message || message.length > 160 || /sql|postgres|syntax|relation/i.test(message)) return "잠시 후 다시 시도해 주세요";
	return message;
}
function Brand() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-4xl leading-none text-ink",
			children: "프피로그"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "brand-sub mt-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex gap-1",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dot dot-blush" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dot dot-butter" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dot dot-mint" })
				]
			}), "INFP X ENFP"]
		})]
	});
}
function Frame({ trailing, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-20 border-b border-line bg-paper",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "page-pad mx-auto flex max-w-6xl items-center justify-between gap-3 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "user-slot shrink-0",
					children: trailing
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "page-pad mx-auto max-w-6xl pt-6",
			children
		})]
	});
}
function ShellSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-line bg-paper",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "page-pad mx-auto flex max-w-6xl items-center justify-between py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-11 animate-pulse rounded-full bg-paper-2" })]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "page-pad mx-auto grid max-w-6xl gap-4 pt-6 lg:grid-cols-[minmax(0,1.45fr)_22rem]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-96 animate-pulse rounded-3xl bg-paper-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-72 animate-pulse rounded-3xl bg-paper-2" })]
		})]
	});
}
function AfterMount({ children, fallback }) {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setReady(true), []);
	return ready ? children : fallback;
}
var STEPS = [
	{
		n: "01",
		title: "달력을 만들어요",
		body: "둘만의 달력 이름을 붙여요.",
		tone: "text-pine"
	},
	{
		n: "02",
		title: "코드를 나눠요",
		body: "여섯 글자면 같은 달로 들어와요.",
		tone: "text-ink"
	},
	{
		n: "03",
		title: "같이 적어요",
		body: "일정이랑 하루 기록이 한 칸에 쌓여요.",
		tone: "text-muted"
	}
];
function Steps() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "grid gap-3 sm:grid-cols-3",
		children: STEPS.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "panel rounded-3xl p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `font-display text-3xl leading-none ${step.tone}`,
					children: step.n
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-3 text-base font-medium",
					children: step.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: step.body
				})
			]
		}, step.n))
	});
}
function SignedOutLanding() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rise mx-auto flex max-w-3xl flex-col gap-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-display text-3xl leading-tight text-ink",
					children: [
						"둘의 하루를",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"한 칸에 적어요"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-md text-base text-muted",
					children: "초대 코드를 받은 사람만 일정과 하루 기록을 남길 수 있어요."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Steps, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid max-w-sm gap-2",
				children: GROK_PROVIDERS.map((provider, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: index === 0 ? "press h-12 bg-pine text-sm font-medium text-on-pine hover:bg-pine-hover" : "press ring-line h-12 bg-butter text-sm font-medium text-ink",
					onClick: () => signIn(provider.providerId, { callbackURL: "/" }),
					children: [provider.label, "로 계속"]
				}, provider.providerId))
			})
		]
	}) });
}
function CreateCard({ onCreated, onCancel }) {
	const [name, setName] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		setPending(true);
		setError("");
		try {
			const result = await createCalendar({ data: { name } });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			onCreated(result.data);
		} catch (caught) {
			setError(errText(caught));
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit,
		className: "panel flex flex-col gap-3 rounded-3xl p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-base font-medium",
				children: "새 달력"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "만든 사람이 초대 코드를 나눠 줘요."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "grid gap-1 text-sm font-medium",
				htmlFor: "calendar-name",
				children: ["이름", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "calendar-name",
					className: "field font-normal",
					value: name,
					maxLength: 40,
					placeholder: "우리 집, 데이트, 여행",
					onChange: (event) => setName(event.target.value),
					required: true
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "text-sm text-ink",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "press h-11 bg-pine px-4 text-sm font-medium text-on-pine hover:bg-pine-hover disabled:opacity-50",
					disabled: pending,
					children: pending ? "만드는 중" : "달력 만들기"
				}), onCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "press h-11 px-4 text-sm font-medium text-muted",
					onClick: onCancel,
					children: "취소"
				}) : null]
			})
		]
	});
}
function JoinCard({ onJoined, onCancel }) {
	const [code, setCode] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		setPending(true);
		setError("");
		try {
			const result = await joinCalendar({ data: { code } });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			onJoined(result.data);
		} catch (caught) {
			setError(errText(caught));
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit,
		className: "panel flex flex-col gap-3 rounded-3xl p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-base font-medium",
				children: "코드로 참여"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "받은 여섯 자리를 그대로 입력해요."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "grid gap-1 text-sm font-medium",
				htmlFor: "invite-code",
				children: ["초대 코드", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "invite-code",
					className: "field font-mono text-base font-normal tracking-widest uppercase",
					value: code,
					maxLength: 12,
					autoCapitalize: "characters",
					autoCorrect: "off",
					spellCheck: false,
					placeholder: "K7MQ2P",
					onChange: (event) => setCode(event.target.value.toUpperCase()),
					required: true
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "text-sm text-ink",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "press h-11 bg-pine px-4 text-sm font-medium text-on-pine hover:bg-pine-hover disabled:opacity-50",
					disabled: pending,
					children: pending ? "들어가는 중" : "들어가기"
				}), onCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "press h-11 px-4 text-sm font-medium text-muted",
					onClick: onCancel,
					children: "취소"
				}) : null]
			})
		]
	});
}
function StartLanding({ onReady }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, {
		trailing: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rise mx-auto flex max-w-3xl flex-col gap-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-3xl leading-tight",
						children: "첫 달력을 열어 두세요"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-base text-muted",
						children: "달력을 만들거나, 받은 초대 코드로 들어와요."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Steps, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 md:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateCard, { onCreated: onReady }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JoinCard, { onJoined: onReady })]
				})
			]
		})
	});
}
//#endregion
export { saveEvent as _, ShellSkeleton as a, UserButton as c, deleteNote as d, errText as f, renameCalendar as g, loadMonth as h, JoinCard as i, deleteCalendar as l, listCalendars as m, CreateCard as n, SignedOutLanding as o, leaveCalendar as p, Frame as r, StartLanding as s, AfterMount as t, deleteEvent as u, saveNote as v, useCurrentUserState as y };
