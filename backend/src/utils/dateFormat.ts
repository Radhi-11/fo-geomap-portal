const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatIndonesianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = INDONESIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function parseIndonesianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split(' ');
  if (parts.length < 3) return null;
  const day = parseInt(parts[0], 10);
  const month = INDONESIAN_MONTHS.findIndex(m => m === parts[1]);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || month === -1 || isNaN(year)) return null;
  return new Date(year, month, day);
}
