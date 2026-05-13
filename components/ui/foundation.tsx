import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Tone = "blue" | "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate";

const toneClasses: Record<Tone, string> = {
  blue: "border-blue-300/30 bg-blue-500/20 text-blue-50",
  cyan: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  emerald: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  rose: "border-rose-300/30 bg-rose-400/10 text-rose-100",
  violet: "border-violet-300/30 bg-violet-300/10 text-violet-100",
  slate: "border-white/10 bg-white/[0.04] text-slate-200",
};

export function AppBackdrop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-[#061225] text-white ${className}`}>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(34,211,238,0.20),transparent_30%),radial-gradient(circle_at_72%_0%,rgba(37,99,235,0.26),transparent_34%),linear-gradient(135deg,#071326_0%,#092050_45%,#041025_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_47%,rgba(96,165,250,0.16)_48%,transparent_49%,transparent_100%)]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export function PageHeader({
  label,
  title,
  description,
  actions,
}: {
  label?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="rounded-lg border border-white/10 bg-slate-950/45 px-5 py-4 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          {label && (
            <p className="inline-flex rounded-sm border border-blue-300/20 bg-blue-400/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
              {label}
            </p>
          )}
          <h1 className={`${label ? "mt-3" : ""} max-w-3xl text-2xl font-semibold leading-snug tracking-normal text-white md:text-3xl`}>
            {title}
          </h1>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants = {
    primary: "border-blue-300/30 bg-blue-500/20 text-blue-50 shadow-blue-950/20 hover:border-blue-200/60 hover:bg-blue-500/30",
    secondary: "border-white/15 bg-white/5 text-white hover:border-blue-200/50 hover:bg-blue-400/10",
    danger: "border-rose-300/30 bg-rose-400/10 text-rose-100 hover:border-rose-200/60 hover:bg-rose-400/20",
    ghost: "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "slate", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-sm border px-2 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-300/60 focus:ring-2 focus:ring-blue-500/25 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-300/60 focus:ring-2 focus:ring-blue-500/25 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-300/60 focus:ring-2 focus:ring-blue-500/25 ${props.className ?? ""}`}
    />
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{children}</span>;
}

export function Alert({ children, tone = "rose" }: { children: ReactNode; tone?: "rose" | "emerald" | "amber" | "blue" }) {
  return <div className={`rounded-md border px-4 py-3 text-sm ${toneClasses[tone]}`}>{children}</div>;
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-white/10 bg-slate-950/50">
      <div className="flex flex-col items-center gap-3 text-slate-200">
        <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
