import Papa from 'papaparse';
import jsPDF from 'jspdf';
import { formatMoney } from './currency';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCSV({ month, incomes, expenses, categories, currency }) {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const rows = [
    ...incomes.map((i) => ({
      Tipo: 'Ingreso',
      Fecha: i.date,
      Categoria: i.source || '',
      Nota: i.note || '',
      Monto: Number(i.amount).toFixed(2),
      Moneda: currency,
    })),
    ...expenses.map((e) => ({
      Tipo: 'Gasto',
      Fecha: e.date,
      Categoria: catMap[e.categoryId] || 'Sin categoría',
      Nota: e.note || '',
      Monto: Number(e.amount).toFixed(2),
      Moneda: currency,
    })),
  ].sort((a, b) => a.Fecha.localeCompare(b.Fecha));

  const csv = Papa.unparse(rows);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `finanzas_${month}.csv`);
}

export function exportPDF({ month, incomes, expenses, categories, currency, summary }) {
  const doc = new jsPDF();
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Reporte Financiero', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Mes: ${month}`, 14, 26);
  doc.text(`Moneda: ${currency}`, 14, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Resumen', 14, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Ingresos: ${formatMoney(summary.totalIncome, currency)}`, 14, 52);
  doc.text(`Gastos: ${formatMoney(summary.totalExpense, currency)}`, 14, 58);
  doc.text(`Balance: ${formatMoney(summary.balance, currency)}`, 14, 64);

  let y = 78;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Gastos por Categoría', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Categoría', 14, y);
  doc.text('Gastado', 90, y);
  doc.text('Límite', 130, y);
  doc.text('%', 170, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  categories.forEach((cat) => {
    const spent = expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + Number(e.amount), 0);
    const pct = cat.monthlyLimit > 0 ? Math.round((spent / cat.monthlyLimit) * 100) : 0;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(cat.name).slice(0, 30), 14, y);
    doc.text(formatMoney(spent, currency), 90, y);
    doc.text(formatMoney(cat.monthlyLimit, currency), 130, y);
    doc.text(`${pct}%`, 170, y);
    y += 6;
  });

  y += 6;
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Transacciones', 14, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha', 14, y);
  doc.text('Tipo', 40, y);
  doc.text('Categoría', 60, y);
  doc.text('Monto', 140, y);
  doc.text('Nota', 170, y);
  y += 5;
  doc.setFont('helvetica', 'normal');

  const rows = [
    ...incomes.map((i) => ({ date: i.date, type: 'Ingreso', cat: i.source || '', amount: i.amount, note: i.note || '' })),
    ...expenses.map((e) => ({ date: e.date, type: 'Gasto', cat: catMap[e.categoryId] || 'Sin categoría', amount: e.amount, note: e.note || '' })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  rows.forEach((r) => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(r.date, 14, y);
    doc.text(r.type, 40, y);
    doc.text(String(r.cat).slice(0, 25), 60, y);
    doc.text(formatMoney(r.amount, currency), 140, y);
    doc.text(String(r.note).slice(0, 20), 170, y);
    y += 5;
  });

  doc.save(`finanzas_${month}.pdf`);
}
