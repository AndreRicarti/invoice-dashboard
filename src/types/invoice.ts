export interface InvoiceCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface InvoiceTransaction {
  id: number;
  date: string;
  title: string;
  amount: number;
  category: string;
  source: string;
  year: number;
  month: number;
  invoiceKey: string;
  isRefund: boolean;
  createdAt: string;
}

export interface CategoryTransactions {
  category: string;
  totalAmount: number;
  transactionCount: number;
  transactions: InvoiceTransaction[];
}

export interface InvoiceSummary {
  invoiceKey: string;
  monthName: string;
  totalSpent: number;
  totalRefunds: number;
  netTotal: number;
  transactionCount: number;
  categories: InvoiceCategory[];
}
