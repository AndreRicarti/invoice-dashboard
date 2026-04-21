import { useState } from "react";
import type { InvoiceCategory, CategoryTransactions } from "../types/invoice";
import { fetchCategoryTransactions, fetchAllCategories, updateTransactionCategory } from "../services/invoiceService";

const CATEGORY_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
];

const CATEGORY_BG = [
  "bg-violet-50 dark:bg-violet-950/30",
  "bg-sky-50 dark:bg-sky-950/30",
  "bg-emerald-50 dark:bg-emerald-950/30",
  "bg-amber-50 dark:bg-amber-950/30",
  "bg-rose-50 dark:bg-rose-950/30",
  "bg-indigo-50 dark:bg-indigo-950/30",
  "bg-teal-50 dark:bg-teal-950/30",
  "bg-orange-50 dark:bg-orange-950/30",
  "bg-pink-50 dark:bg-pink-950/30",
  "bg-cyan-50 dark:bg-cyan-950/30",
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

interface CategoryListProps {
  categories: InvoiceCategory[];
  invoiceKey: string;
}

export function CategoryList({ categories, invoiceKey }: CategoryListProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, CategoryTransactions>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<Record<string, string>>({});
  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleEditClick(txId: number) {
    setEditingTxId(txId);
    setSaveError(null);
    if (allCategories.length > 0) return;
    setCategoriesLoading(true);
    try {
      const cats = await fetchAllCategories();
      setAllCategories(cats);
    } catch {
      // keep empty
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function handleCategoryChange(txId: number, oldCategory: string, newCategory: string) {
    if (newCategory === oldCategory) {
      setEditingTxId(null);
      return;
    }
    setSaving(txId);
    setSaveError(null);
    try {
      await updateTransactionCategory(txId, newCategory);

      const categoriesToReload = Array.from(new Set([oldCategory, newCategory]));
      const results = await Promise.all(
        categoriesToReload.map((cat) =>
          fetchCategoryTransactions(invoiceKey, cat).then((items) => ({ cat, items }))
        )
      );

      setCache((prev) => {
        const updated = { ...prev };
        for (const { cat, items } of results) {
          const match = items.find((i) => i.category === cat);
          if (match) {
            updated[cat] = match;
          } else {
            updated[cat] = { ...(prev[cat] ?? { category: cat, totalAmount: 0, transactionCount: 0 }), transactions: [] };
          }
        }
        return updated;
      });

      setEditingTxId(null);
    } catch {
      setSaveError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(null);
    }
  }

  async function handleToggle(categoryName: string) {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
      return;
    }

    setExpandedCategory(categoryName);
    setError(null);

    if (cache[categoryName]) return;

    setLoading(categoryName);
    try {
      const all = await fetchCategoryTransactions(invoiceKey);
      const newEntries: Record<string, CategoryTransactions> = {};
      for (const item of all) {
        newEntries[item.category] = item;
      }
      setCache((prev) => ({ ...prev, ...newEntries }));
    } catch (err) {
      setError(categoryName);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.map((cat, i) => {
        const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
        const bg = CATEGORY_BG[i % CATEGORY_BG.length];
        const isOpen = expandedCategory === cat.category;
        const isLoading = loading === cat.category;
        const hasError = error === cat.category;
        const data = cache[cat.category];
        const query = (search[cat.category] ?? "").toLowerCase().trim();
        const transactions = data
          ? [...data.transactions]
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .filter((tx) => !query || tx.title.toLowerCase().includes(query))
          : [];

        return (
          <div key={cat.category} className={`rounded-xl ${bg} border border-white/60 dark:border-slate-800 overflow-hidden`}>
            {/* Category row — clickable */}
            <button
              onClick={() => handleToggle(cat.category)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{cat.category}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(cat.amount)}</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-12 text-right">{cat.percentage.toFixed(1)}%</span>
                  <svg
                    className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/70 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${color}`}
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </button>

            {/* Expanded transactions */}
            {isOpen && (
              <div className="border-t border-white/60 dark:border-slate-800">
                {!isLoading && !hasError && (
                  <div className="px-4 pt-3 pb-1">
                    <input
                      type="text"
                      placeholder="Filtrar transações..."
                      value={search[cat.category] ?? ""}
                      onChange={(e) =>
                        setSearch((prev) => ({ ...prev, [cat.category]: e.target.value }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-sm rounded-lg px-3 py-1.5 bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-600"
                    />
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-center justify-center py-6 gap-2 text-slate-400 dark:text-slate-500 text-sm">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Carregando transações...
                  </div>
                )}

                {hasError && (
                  <div className="flex flex-col items-center gap-2 py-5 text-sm">
                    <span className="text-rose-500 dark:text-rose-400">Erro ao carregar transações.</span>
                    <button
                      onClick={() => { setError(null); handleToggle(cat.category); }}
                      className="text-xs text-violet-600 dark:text-violet-400 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

                {!isLoading && !hasError && transactions.length === 0 && (
                  <p className="text-center py-5 text-sm text-slate-400 dark:text-slate-500">
                    {query ? "Nenhuma transação encontrada para esse filtro." : "Nenhuma transação encontrada."}
                  </p>
                )}

                {!isLoading && !hasError && transactions.length > 0 && (
                  <>
                    {saveError && (
                      <p className="mx-4 mb-1 text-xs text-rose-500 dark:text-rose-400">{saveError}</p>
                    )}
                    <ul className="divide-y divide-white/60 dark:divide-slate-800">
                      {transactions.map((tx) => (
                        <li key={tx.id} className="flex items-center justify-between px-4 py-2 gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 tabular-nums w-20 text-right">{formatDate(tx.date)}</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{tx.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {editingTxId === tx.id ? (
                              <>
                                {categoriesLoading ? (
                                  <svg className="w-3.5 h-3.5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                ) : (
                                  <select
                                    defaultValue={tx.category}
                                    onChange={(e) => { e.stopPropagation(); handleCategoryChange(tx.id, tx.category, e.target.value); }}
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={saving === tx.id}
                                    autoFocus
                                    className="text-xs rounded-md px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
                                  >
                                    {allCategories.map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                )}
                                {saving === tx.id && (
                                  <svg className="w-3.5 h-3.5 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingTxId(null); setSaveError(null); }}
                                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                  title="Cancelar"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                {tx.isRefund && (
                                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                    Reembolso
                                  </span>
                                )}
                                <span className={`text-sm font-semibold ${tx.isRefund ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100"}`}>
                                  {formatCurrency(tx.amount)}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditClick(tx.id); }}
                                  className="p-1 rounded text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                                  title="Alterar categoria"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
