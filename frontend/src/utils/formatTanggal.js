// ============================================
// Format Tanggal — FinStocks
// ============================================
// Konversi tanggal ke format Indonesia
// Contoh: "2026-05-10T10:30:00Z" → "10 Mei 2026"

import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format tanggal ke format Indonesia lengkap
 * Contoh: "10 Mei 2026"
 * @param {string|Date} tanggal - Tanggal yang akan diformat
 * @returns {string} Tanggal dalam format Indonesia
 */
export const formatTanggal = (tanggal) => {
  if (!tanggal) return '-';
  const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;
  return format(date, 'd MMMM yyyy', { locale: id });
};

/**
 * Format tanggal dengan waktu
 * Contoh: "10 Mei 2026, 10:30"
 * @param {string|Date} tanggal
 * @returns {string}
 */
export const formatTanggalWaktu = (tanggal) => {
  if (!tanggal) return '-';
  const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;
  return format(date, 'd MMMM yyyy, HH:mm', { locale: id });
};

/**
 * Format tanggal relatif
 * Contoh: "3 menit yang lalu", "Hari ini, 10:30", "Kemarin, 14:00"
 * @param {string|Date} tanggal
 * @returns {string}
 */
export const formatTanggalRelatif = (tanggal) => {
  if (!tanggal) return '-';
  const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;

  if (isToday(date)) {
    return `Hari ini, ${format(date, 'HH:mm')}`;
  }
  if (isYesterday(date)) {
    return `Kemarin, ${format(date, 'HH:mm')}`;
  }
  return formatDistanceToNow(date, { addSuffix: true, locale: id });
};

/**
 * Format tanggal singkat untuk tabel
 * Contoh: "10/05/2026"
 * @param {string|Date} tanggal
 * @returns {string}
 */
export const formatTanggalSingkat = (tanggal) => {
  if (!tanggal) return '-';
  const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;
  return format(date, 'dd/MM/yyyy');
};

/**
 * Tanggal "YYYY-MM-DD" menurut zona waktu browser (bukan UTC).
 * Hindari `toISOString().split('T')[0]`: di WIB, jam 00:00–06:59
 * masih terhitung tanggal kemarin.
 * Contoh: "2026-10-06T17:06:40Z" → "2026-10-07" (WIB)
 * @param {string|Date} [tanggal] - default: sekarang
 * @returns {string}
 */
export const toTanggalLokal = (tanggal = new Date()) => {
  const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;
  return format(date, 'yyyy-MM-dd');
};
