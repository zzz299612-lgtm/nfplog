import { x as require_jsx_runtime, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as ShellSkeleton, o as SignedOutLanding, t as AfterMount, y as useCurrentUserState } from "./chrome-XAKc5oIZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-CpH9lAaD.js
var import_jsx_runtime = require_jsx_runtime();
function LoginReady() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {});
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOutLanding, {});
}
function LoginPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AfterMount, {
		fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginReady, {})
	});
}
//#endregion
export { LoginPage as component };
