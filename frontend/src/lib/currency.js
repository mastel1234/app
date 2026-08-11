export const CURRENCIES = [
  { code: 'DOP', symbol: 'RD$', name: 'Peso Dominicano', locale: 'es-DO' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'es-ES' },
  { code: 'MXN', symbol: 'MX$', name: 'Peso Mexicano', locale: 'es-MX' },
  { code: 'COP', symbol: 'COL$', name: 'Peso Colombiano', locale: 'es-CO' },
  { code: 'ARS', symbol: 'AR$', name: 'Peso Argentino', locale: 'es-AR' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina', locale: 'en-GB' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño', locale: 'pt-BR' },
];

export function formatMoney(amount, currencyCode = 'DOP') {
  const cur = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  try {
    return new Intl.NumberFormat(cur.locale, {
      style: 'currency',
      currency: cur.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${cur.symbol} ${(Number(amount) || 0).toFixed(2)}`;
  }
}

export function getCurrencySymbol(currencyCode = 'DOP') {
  const cur = CURRENCIES.find((c) => c.code === currencyCode);
  return cur ? cur.symbol : currencyCode;
}
