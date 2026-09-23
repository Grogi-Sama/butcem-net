export const palette = {
  income: '#16a34a',
  incomeSoft: '#dcfce7',
  expense: '#dc2626',
  expenseSoft: '#fee2e2',
  primary: '#4f46e5',
  primarySoft: '#e0e7ff',
  warning: '#f59e0b',
  warningSoft: '#fef3c7',
};

export const lightTheme = {
  ...palette,
  background: '#f5f6fa',
  card: '#ffffff',
  text: '#111827',
  subtext: '#6b7280',
  border: '#e8eaf0',
  tabBar: '#ffffff',
};

export const darkTheme = {
  ...palette,
  background: '#0b0e17',
  card: '#161b26',
  text: '#f3f4f6',
  subtext: '#9aa3b2',
  border: '#242a38',
  tabBar: '#0f131e',
};

export type AppTheme = typeof lightTheme;
