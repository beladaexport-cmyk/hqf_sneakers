// Безопасный парсинг даты — работает и со строкой и с Firestore Timestamp
export const safeDate = (val: unknown): string => {
  if (!val) return '';
  try {
    // Firestore Timestamp objects have a .toDate() method
    if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as any).toDate === 'function') {
      return (val as any).toDate().toISOString();
    }
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
