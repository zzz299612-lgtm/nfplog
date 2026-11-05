import { createFileRoute } from "@tanstack/react-router";
import { CalendarScreen } from "@/components/calendar/screen";

export const Route = createFileRoute("/")({ component: CalendarScreen });
