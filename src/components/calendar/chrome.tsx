import { useEffect, useState, type ReactNode } from "react";
import { Heart } from "lucide-react";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";

const TOGETHER_START = "2026-11-03";

function togetherDays(now = new Date()): number {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const today = Date.parse(`${key}T00:00:00Z`);
  const start = Date.parse(`${TOGETHER_START}T00:00:00Z`);
  return Math.round((today - start) / 86_400_000) + 1;
}

function DayMark() {
  const days = togetherDays();
  const label = `${days > 0 ? "+" : ""}${days}일`;
  return (
    <p
      className="flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-sm font-medium text-ink ring-1 ring-line"
      aria-label={`2026년 11월 3일부터 ${label}`}
    >
      <Heart className="size-4 fill-blush text-blush" aria-hidden />
      <span className="font-display text-lg leading-none tabular-nums">{label}</span>
    </p>
  );
}

export function errText(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "Unauthorized") return "로그인이 필요합니다";
  if (!message || message.length > 160 || /sql|postgres|syntax|relation/i.test(message)) {
    return "잠시 후 다시 시도해 주세요";
  }
  return message;
}

function Brand() {
  return (
    <div className="min-w-0">
      <h1 className="font-display text-4xl leading-none text-ink">프피로그</h1>
      <p className="brand-sub mt-2">
        <span className="flex gap-1" aria-hidden="true">
          <span className="dot dot-blush" />
          <span className="dot dot-butter" />
          <span className="dot dot-mint" />
        </span>
        INFP X ENFP
      </p>
    </div>
  );
}

export function Frame({
  trailing,
  children,
}: {
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-paper">
        <div className="page-pad mx-auto flex max-w-6xl items-center justify-between gap-3 py-4">
          <Brand />
          <div className="user-slot flex shrink-0 items-center gap-2">
            <DayMark />
            {trailing}
          </div>
        </div>
      </header>
      <main className="page-pad mx-auto max-w-6xl pt-6">{children}</main>
    </div>
  );
}

export function ShellSkeleton() {
  return (
    <div className="min-h-screen text-ink">
      <header className="border-b border-line bg-paper">
        <div className="page-pad mx-auto flex max-w-6xl items-center justify-between py-4">
          <Brand />
          <DayMark />
        </div>
      </header>
      <div className="page-pad mx-auto grid max-w-6xl gap-4 pt-6 lg:grid-cols-[minmax(0,1.45fr)_22rem]">
        <div className="h-96 animate-pulse rounded-3xl bg-paper-2" />
        <div className="h-72 animate-pulse rounded-3xl bg-paper-2" />
      </div>
    </div>
  );
}

export function AfterMount({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? children : fallback;
}

const STEPS = [
  { n: "01", title: "같이 들어와요", body: "로그인한 사람은 같은 달력으로 들어와요." },
  { n: "02", title: "하루를 적어요", body: "일정이랑 하루 기록이 한 칸에 쌓여요." },
  { n: "03", title: "숲처럼 고요해요", body: "둘의 달력을 천천히 채워 가요." },
];

function Steps() {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {STEPS.map((step) => (
        <li key={step.n} className="panel rounded-3xl p-4">
          <p className="font-display text-3xl leading-none text-pine">{step.n}</p>
          <h2 className="mt-3 text-base font-medium">{step.title}</h2>
          <p className="mt-1 text-sm text-muted">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function Cover() {
  return (
    <img
      src="/cover.svg"
      alt=""
      className="aspect-[1200/630] w-full rounded-3xl object-cover ring-1 ring-line"
    />
  );
}

export function SignedOutLanding() {
  return (
    <Frame>
      <div className="rise mx-auto flex max-w-3xl flex-col gap-6">
        <Cover />
        <div className="max-w-xl">
          <h2 className="font-display text-3xl leading-tight text-ink">
            둘의 하루를
            <br />
            한 칸에 적어요
          </h2>
          <p className="mt-3 max-w-md text-base text-muted">
            로그인하면 같은 달력에 일정과 하루 기록을 같이 남길 수 있어요.
          </p>
        </div>
        <Steps />
        <div className="grid max-w-sm gap-2">
          {GROK_PROVIDERS.map((provider, index) => (
            <button
              key={provider.providerId}
              type="button"
              className={
                index === 0
                  ? "press h-12 bg-pine text-sm font-medium text-on-pine hover:bg-pine-hover"
                  : "press ring-line h-12 bg-butter text-sm font-medium text-ink"
              }
              onClick={() => signIn(provider.providerId, { callbackURL: "/" })}
            >
              {provider.label}로 계속
            </button>
          ))}
        </div>
      </div>
    </Frame>
  );
}
