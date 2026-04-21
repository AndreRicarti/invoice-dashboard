import type { InvoiceSummary, CategoryTransactions } from "../types/invoice";

const BASE_URL = "/api";

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

export async function fetchAllCategories(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/Transaction/categories`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar categorias: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "string") {
    return data as string[];
  }
  return (data as Array<{ category?: string; name?: string }>).map(
    (item) => item.category ?? item.name ?? String(item)
  );
}

export async function updateTransactionCategory(transactionId: number, category: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/Transaction/${transactionId}/category`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(category),
  });

  if (!response.ok) {
    throw new Error(`Erro ao alterar categoria: ${response.status} ${response.statusText}`);
  }
}
