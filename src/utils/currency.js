export const parsePrice = (amount) => {
  if (amount === undefined || amount === null) return 0;
  if (typeof amount === 'number') return isNaN(amount) ? 0 : amount;
  const cleaned = amount.toString().replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatCurrency = (amount, language = 'en', forceNegative = false) => {
  if (amount === undefined || amount === null) return '0.00 DH';
  const str = amount.toString().trim();
  const isNegative = forceNegative || str.startsWith('-') || (typeof amount === 'number' && amount < 0);
  const num = typeof amount === 'number' ? Math.abs(amount) : Math.abs(parseFloat(str.replace(/[^0-9.]/g, '') || '0'));
  const formatted = isNaN(num) ? '0.00' : num.toFixed(2);
  
  if (language && (language === 'ar' || language.startsWith('ar'))) {
    return isNegative ? `\u200E-${formatted} د.م.` : `${formatted} د.م.`;
  }
  return isNegative ? `-${formatted} DH` : `${formatted} DH`;
};

