interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "danger" | "neutral";
  subtitle?: string;
}

const variantStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200",
  success: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300",
  danger: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300",
  neutral: "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:border-sky-900 dark:text-sky-300",
};

const iconVariant: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300",
  danger: "bg-rose-100 text-rose-500 dark:bg-rose-900/60 dark:text-rose-300",
  neutral: "bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-300",
};

export function StatCard({ title, value, icon, variant = "default", subtitle }: StatCardProps) {
  return (
    <div className={`rounded-lg border px-3.5 py-3 flex items-center gap-2.5 shadow-sm ${variantStyles[variant]}`}>
      <div className={`p-2 rounded-md shrink-0 ${iconVariant[variant]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-70 mb-0.5">{title}</p>
        <p className="text-[1.65rem] font-bold leading-none truncate">{value}</p>
        {subtitle && <p className="text-[10px] mt-0.5 opacity-65">{subtitle}</p>}
      </div>
    </div>
  );
}
