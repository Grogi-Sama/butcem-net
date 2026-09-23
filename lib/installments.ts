import { Transaction } from '@/types';

export interface InstallmentGroup {
  groupId: string;
  name: string;
  categoryId: string;
  totalAmount: number;
  totalCount: number;
  paidCount: number;
  remainingAmount: number;
  transactions: Transaction[];
}

/** Groups installment-tagged expense transactions by their shared group id. */
export function getInstallmentGroups(transactions: Transaction[]): InstallmentGroup[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (!t.installment) continue;
    const list = groups.get(t.installment.groupId) ?? [];
    list.push(t);
    groups.set(t.installment.groupId, list);
  }

  const now = Date.now();

  return Array.from(groups.entries())
    .map(([groupId, txs]) => {
      const sorted = [...txs].sort((a, b) => (a.installment?.index ?? 0) - (b.installment?.index ?? 0));
      const paid = sorted.filter((t) => new Date(t.date).getTime() <= now);
      const totalAmount = sorted.reduce((s, t) => s + t.amount, 0);
      const paidAmount = paid.reduce((s, t) => s + t.amount, 0);
      return {
        groupId,
        name: sorted[0].name,
        categoryId: sorted[0].categoryId,
        totalAmount,
        totalCount: sorted[0].installment?.total ?? sorted.length,
        paidCount: paid.length,
        remainingAmount: totalAmount - paidAmount,
        transactions: sorted,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}
