import type { InvoiceSummary, CategoryTransactions } from "../types/invoice";

const BASE_URL = "/api";

export async function fetchInvoiceSummary(key: string): Promise<InvoiceSummary> {
  const response = await fetch(`${BASE_URL}/Invoice/key/${key}/summary`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar fatura: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchCategoryTransactions(key: string): Promise<CategoryTransactions[]> {
  const response = await fetch(`${BASE_URL}/Invoice/key/${key}/transactions-by-category`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar transações: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
