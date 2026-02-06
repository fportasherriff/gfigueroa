// Utility functions for formatting dashboard data

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCurrencyFull = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatDateShort = (date: string | Date): string => {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date));
};

export const formatMonthYear = (date: string | Date): string => {
  // Parse date string as local date to avoid timezone shift
  if (typeof date === 'string') {
    const [year, month] = date.split('-').map(Number);
    // Create date at noon to avoid any timezone edge cases
    const localDate = new Date(year, month - 1, 15, 12, 0, 0);
    return new Intl.DateTimeFormat('es-AR', {
      month: 'short',
      year: '2-digit',
    }).format(localDate);
  }
  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    year: '2-digit',
  }).format(date);
};

// Parse a date string (YYYY-MM-DD) as local date without timezone conversion
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day || 1, 12, 0, 0);
};

// Get month key (YYYY-MM) from a date string without timezone issues
export const getMonthKey = (dateStr: string): string => {
  const [year, month] = dateStr.split('-').map(Number);
  return `${year}-${String(month).padStart(2, '0')}`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-AR').format(value);
};

export const getRiskBadgeColor = (riesgo: string): string => {
  const colors: Record<string, string> = {
    'Bajo': 'bg-green-100 text-green-700 border-green-200',
    'Medio': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Alto': 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[riesgo] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export const getPriorityBadgeColor = (prioridad: string): string => {
  const colors: Record<string, string> = {
    'Crítica': 'bg-red-100 text-red-700 border-red-300',
    'Alta': 'bg-orange-100 text-orange-700 border-orange-300',
    'Media': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Baja': 'bg-gray-100 text-gray-700 border-gray-300',
  };
  return colors[prioridad] || 'bg-gray-100 text-gray-700 border-gray-300';
};

export const getTasaColor = (tasa: number, thresholds: { good: number; warning: number }): string => {
  if (tasa >= thresholds.good) return 'text-green-600 bg-green-50';
  if (tasa >= thresholds.warning) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

export const getDaysColor = (days: number | null): string => {
  if (days === null) return 'text-gray-400';
  if (days < 30) return 'text-green-600';
  if (days < 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};
