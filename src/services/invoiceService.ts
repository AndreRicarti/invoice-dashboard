import type { InvoiceSummary, CategoryTransactions } from "../types/invoice";

function resolveApiBaseUrl(): string {
  const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  if (!configuredBaseUrl) {
    return "/api";
  }

  return configuredBaseUrl.replace(/\/$/, "");
}

const BASE_URL = resolveApiBaseUrl();

export interface TransactionCategoryOption {
  id: number;
  name: string;
}

export async function fetchInvoiceSummary(key: string): Promise<InvoiceSummary> {
  const response = await fetch(`${BASE_URL}/Invoice/key/${key}/summary`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar fatura: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchCategoryTransactions(key: string, category?: string): Promise<CategoryTransactions[]> {
  const url = category
    ? `${BASE_URL}/Invoice/key/${key}/transactions-by-category?category=${encodeURIComponent(category)}`
    : `${BASE_URL}/Invoice/key/${key}/transactions-by-category`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro ao buscar transações: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchAllCategories(): Promise<TransactionCategoryOption[]> {
  const response = await fetch(`${BASE_URL}/Transaction/categories`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar categorias: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Array<{ id?: number; name?: string; category?: string }>;
  return data
    .map((item, index) => ({
      id: item.id ?? index,
      name: item.name ?? item.category ?? "",
    }))
    .filter((item) => item.name.length > 0);
}

export async function updateTransactionCategory(transactionId: number, categoryId: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/Transaction/${transactionId}/category`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoryId }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao alterar categoria: ${response.status} ${response.statusText}`);
  }
}

export async function updateTransactionTitle(invoiceKey: string, transactionId: number, title: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/Transaction/${invoiceKey}/${transactionId}/title`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao alterar título: ${response.status} ${response.statusText}`);
  }
}
