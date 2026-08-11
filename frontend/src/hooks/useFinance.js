import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadData, saveData } from '../lib/storage';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function monthKey(dateStr) {
  return (dateStr || '').slice(0, 7); // YYYY-MM
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useFinance() {
  const [data, setData] = useState(() => loadData());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const setCurrency = useCallback((currency) => {
    setData((d) => ({ ...d, currency }));
  }, []);

  const addCategory = useCallback((cat) => {
    setData((d) => ({
      ...d,
      categories: [...d.categories, { id: uid(), monthlyLimit: 0, color: cat.color || '#4B8B6B', ...cat }],
    }));
  }, []);

  const updateCategory = useCallback((id, updates) => {
    setData((d) => ({
      ...d,
      categories: d.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const deleteCategory = useCallback((id) => {
    setData((d) => ({
      ...d,
      categories: d.categories.filter((c) => c.id !== id),
      expenses: d.expenses.filter((e) => e.categoryId !== id),
      frequents: (d.frequents || []).filter((f) => f.categoryId !== id),
    }));
  }, []);

  const addExpense = useCallback((exp) => {
    setData((d) => ({ ...d, expenses: [...d.expenses, { id: uid(), ...exp }] }));
  }, []);

  const deleteExpense = useCallback((id) => {
    setData((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));
  }, []);

  const addIncome = useCallback((inc) => {
    setData((d) => ({ ...d, incomes: [...d.incomes, { id: uid(), ...inc }] }));
  }, []);

  const deleteIncome = useCallback((id) => {
    setData((d) => ({ ...d, incomes: d.incomes.filter((i) => i.id !== id) }));
  }, []);

  const addGoal = useCallback((goal) => {
    setData((d) => ({ ...d, goals: [...d.goals, { id: uid(), currentAmount: 0, ...goal }] }));
  }, []);

  const updateGoal = useCallback((id, updates) => {
    setData((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) }));
  }, []);

  const deleteGoal = useCallback((id) => {
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }, []);

  const resetAll = useCallback(() => {
    setData({ currency: data.currency, incomes: [], expenses: [], categories: [], goals: [], frequents: [], notificationsEnabled: false, notifiedThresholds: {} });
  }, [data.currency]);

  const importAll = useCallback((next) => setData(next), []);

  const addFrequent = useCallback((freq) => {
    setData((d) => ({ ...d, frequents: [...(d.frequents || []), { id: uid(), ...freq }] }));
  }, []);

  const updateFrequent = useCallback((id, updates) => {
    setData((d) => ({ ...d, frequents: (d.frequents || []).map((f) => (f.id === id ? { ...f, ...updates } : f)) }));
  }, []);

  const deleteFrequent = useCallback((id) => {
    setData((d) => ({ ...d, frequents: (d.frequents || []).filter((f) => f.id !== id) }));
  }, []);

  const applyFrequent = useCallback((freq) => {
    const today = new Date().toISOString().slice(0, 10);
    setData((d) => ({
      ...d,
      expenses: [
        ...d.expenses,
        { id: uid(), amount: Number(freq.amount), categoryId: freq.categoryId, date: today, note: freq.note || freq.name },
      ],
    }));
  }, []);

  const setNotificationsEnabled = useCallback((enabled) => {
    setData((d) => ({ ...d, notificationsEnabled: enabled }));
  }, []);

  const markThresholdNotified = useCallback((month, categoryId, threshold) => {
    setData((d) => {
      const key = `${month}_${categoryId}`;
      const current = (d.notifiedThresholds && d.notifiedThresholds[key]) || [];
      if (current.includes(threshold)) return d;
      return {
        ...d,
        notifiedThresholds: { ...(d.notifiedThresholds || {}), [key]: [...current, threshold] },
      };
    });
  }, []);

  const monthly = useMemo(() => {
    const incomes = data.incomes.filter((i) => monthKey(i.date) === selectedMonth);
    const expenses = data.expenses.filter((e) => monthKey(e.date) === selectedMonth);
    const goals = data.goals.filter((g) => g.month === selectedMonth);
    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const balance = totalIncome - totalExpense;

    const byCategory = data.categories.map((cat) => {
      const spent = expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + Number(e.amount), 0);
      const pct = cat.monthlyLimit > 0 ? (spent / cat.monthlyLimit) * 100 : 0;
      return { ...cat, spent, percent: pct, over: cat.monthlyLimit > 0 && spent > cat.monthlyLimit };
    });

    const overLimit = byCategory.filter((c) => c.over);

    return { incomes, expenses, goals, totalIncome, totalExpense, balance, byCategory, overLimit };
  }, [data, selectedMonth]);

  const availableMonths = useMemo(() => {
    const set = new Set([selectedMonth, currentMonth()]);
    data.incomes.forEach((i) => set.add(monthKey(i.date)));
    data.expenses.forEach((e) => set.add(monthKey(e.date)));
    data.goals.forEach((g) => set.add(g.month));
    return Array.from(set).filter(Boolean).sort().reverse();
  }, [data, selectedMonth]);

  return {
    data,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    monthly,
    setCurrency,
    addCategory,
    updateCategory,
    deleteCategory,
    addExpense,
    deleteExpense,
    addIncome,
    deleteIncome,
    addGoal,
    updateGoal,
    deleteGoal,
    resetAll,
    importAll,
    addFrequent,
    updateFrequent,
    deleteFrequent,
    applyFrequent,
    setNotificationsEnabled,
    markThresholdNotified,
  };
}
