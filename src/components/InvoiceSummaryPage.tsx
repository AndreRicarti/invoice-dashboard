import { useEffect, useState } from "react";
import type { InvoiceSummary as InvoiceSummaryType } from "../types/invoice";
import { fetchInvoiceSummary } from "../services/invoiceService";
import { StatCard } from "./StatCard";
import { CategoryList } from "./CategoryList";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

// Icons
function IconReceipt() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m0 0l-6-6m6 6H3m12 0h6" />
    </svg>
  );
}
function IconArrowDown() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconArrowUp() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}
function IconHash() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function shiftPeriod(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface InvoiceSummaryPageProps {
  invoiceKey?: string;
}

export function InvoiceSummaryPage({ invoiceKey: initialKey = "2026-03" }: InvoiceSummaryPageProps) {
  const [period, setPeriod] = useState(initialKey);
  const [data, setData] = useState<InvoiceSummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const shouldUseDark = storedTheme
      ? storedTheme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  function toggleTheme() {
    const nextThemeIsDark = !isDark;
    setIsDark(nextThemeIsDark);
    document.documentElement.classList.toggle("dark", nextThemeIsDark);
    localStorage.setItem("theme", nextThemeIsDark ? "dark" : "light");
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInvoiceSummary(period);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados não encontrados."} onRetry={load} />;

  const savingsPercent = data.totalSpent > 0
    ? ((data.totalRefunds / data.totalSpent) * 100).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white/90 border-b border-slate-100 sticky top-0 z-10 backdrop-blur dark:bg-slate-900/90 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-base dark:text-slate-100">Resumo da Fatura</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPeriod(p => shiftPeriod(p, -1))}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="Período anterior"
                title="Período anterior"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <input
                type="month"
                value={period}
                onChange={e => { if (e.target.value) setPeriod(e.target.value); }}
                className="h-8 px-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono border-0 outline-none focus:ring-2 focus:ring-violet-400 dark:bg-slate-800 dark:text-slate-200"
              />
              <button
                onClick={() => setPeriod(p => shiftPeriod(p, 1))}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="Próximo período"
                title="Próximo período"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
              title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5m0 15V21m6.364-15.364l-1.06 1.06M6.696 17.304l-1.06 1.06M21 12h-1.5m-15 0H3m15.364 6.364l-1.06-1.06M6.696 6.696l-1.06-1.06M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3c0 .067 0 .133.002.2A7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Month Hero */}
        <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white shadow-lg shadow-violet-200 dark:shadow-violet-950/60">
          <p className="text-violet-200 text-xs font-semibold uppercase tracking-widest mb-1">Período</p>
          <h1 className="text-3xl font-extrabold capitalize leading-none mb-4">{data.monthName}</h1>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-violet-200 text-xs mb-1">Total líquido</p>
              <p className="text-4xl font-black">{formatCurrency(data.netTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-violet-200 text-xs mb-1">{data.transactionCount} transações</p>
              <p className="text-base font-semibold">{savingsPercent}% reembolsado</p>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Visão geral</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard
              title="Total gasto"
              value={formatCurrency(data.totalSpent)}
              icon={<IconArrowUp />}
              variant="danger"
            />
            <StatCard
              title="Total de reembolsos"
              value={formatCurrency(data.totalRefunds)}
              icon={<IconArrowDown />}
              variant="success"
              subtitle={`${savingsPercent}% do total gasto`}
            />
            <StatCard
              title="Total líquido"
              value={formatCurrency(data.netTotal)}
              icon={<IconReceipt />}
              variant="neutral"
            />
            <StatCard
              title="Transações"
              value={String(data.transactionCount)}
              icon={<IconHash />}
              variant="default"
              subtitle="no período"
            />
          </div>
        </section>

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Categorias</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">{data.categories.length} categorias</span>
          </div>
          <CategoryList categories={data.categories} invoiceKey={data.invoiceKey} />
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-300 dark:text-slate-600 pb-4">
          Dados referentes a {data.monthName}
        </footer>
      </main>
    </div>
  );
}
