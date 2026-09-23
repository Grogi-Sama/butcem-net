import { Category } from '@/types';

export const INCOME_CATEGORIES: Category[] = [
  { id: 'inc-salary', name: 'Maaş', type: 'income', icon: '💼' },
  { id: 'inc-side', name: 'Ek Gelir', type: 'income', icon: '🧾' },
  { id: 'inc-freelance', name: 'Freelance', type: 'income', icon: '💻' },
  { id: 'inc-investment', name: 'Yatırım Geliri', type: 'income', icon: '📈' },
  { id: 'inc-rent', name: 'Kira Geliri', type: 'income', icon: '🏠' },
  { id: 'inc-gift', name: 'Hediye', type: 'income', icon: '🎁' },
  { id: 'inc-refund', name: 'İade', type: 'income', icon: '↩️' },
  { id: 'inc-other', name: 'Diğer', type: 'income', icon: '➕' },
];

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp-rent', name: 'Kira', type: 'expense', icon: '🏠' },
  { id: 'exp-bill', name: 'Fatura', type: 'expense', icon: '💡' },
  { id: 'exp-dues', name: 'Aidat', type: 'expense', icon: '🏢' },
  { id: 'exp-credit-card', name: 'Kredi Kartı', type: 'expense', icon: '💳' },
  { id: 'exp-loan', name: 'Kredi/Borç', type: 'expense', icon: '🏦' },
  { id: 'exp-investment', name: 'Yatırım', type: 'expense', icon: '📈' },
  { id: 'exp-grocery', name: 'Market/Yiyecek', type: 'expense', icon: '🛒' },
  { id: 'exp-shopping', name: 'Alışveriş', type: 'expense', icon: '🛍️' },
  { id: 'exp-transport', name: 'Ulaşım', type: 'expense', icon: '🚗' },
  { id: 'exp-health', name: 'Sağlık', type: 'expense', icon: '💊' },
  { id: 'exp-education', name: 'Eğitim', type: 'expense', icon: '🎓' },
  { id: 'exp-entertainment', name: 'Eğlence', type: 'expense', icon: '🎬' },
  { id: 'exp-subscription', name: 'Abonelik', type: 'expense', icon: '🔁' },
  { id: 'exp-other', name: 'Diğer', type: 'expense', icon: '➕' },
];

export const ALL_CATEGORIES: Category[] = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoriesByType(type: 'income' | 'expense'): Category[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function getCategoryById(id: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id);
}
