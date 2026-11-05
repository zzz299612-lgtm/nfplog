//#region node_modules/.nitro/vite/services/ssr/assets/types-2kGkb9PI.js
var TAGS = [
	{
		id: "plan",
		label: "일정"
	},
	{
		id: "task",
		label: "할 일"
	},
	{
		id: "mark",
		label: "기념"
	},
	{
		id: "memo",
		label: "메모"
	}
];
function isTag(value) {
	return TAGS.some((tag) => tag.id === value);
}
var CALENDAR_STORAGE_KEY = "uridal.calendar";
//#endregion
export { TAGS as n, isTag as r, CALENDAR_STORAGE_KEY as t };
