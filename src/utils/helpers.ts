// Безопасный парсинг даты
export const safeDate = (val: unknown): string => {
  if (!val) return '';
  try {
    const d = new Date(val as string);
    if (isNaN(d.getTime())) return '';
    return d.toISOString();
  } catch {
    return '';
  }
};

// Форматирование даты для отображения
export const formatDate = (val: unknown): string => {
  const iso = safeDate(val);
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Безопасное число
export const safeNumber = (val: unknown): number => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

// Форматирование суммы
export const formatMoney = (val: unknown): string => {
  return `${safeNumber(val).toLocaleString('ru-RU')} Br`;
};
