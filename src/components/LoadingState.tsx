export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-950/60" />
        <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 dark:border-t-violet-400 animate-spin" />
      </div>
      <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Carregando fatura...</p>
    </div>
  );
}
