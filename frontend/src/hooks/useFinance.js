import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
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

  // 1. Cargar datos iniciales desde Supabase y escuchar cambios en tiempo real
  useEffect(() => {
    const fetchCloudTransactions = async () => {
      const { data: cloudTx, error } = await supabase
        .from('transactions')
        .select('*');

      if (!error && cloudTx) {
        const cloudIncomes = cloudTx
          .filter((t) => t.type === 'income')
          .map((t) => ({ id: t.id, amount: Number(t.amount), source: t.source, date: t.date, note: t.note }));

        const cloudExpenses = cloudTx
          .filter((t) => t.type === 'expense')
          .map((t) => ({ id: t.id, amount: Number(t.amount), categoryId: t.category_id, date: t.date, note: t.note }));

        setData((prev) => ({
          ...prev,
          incomes: cloudIncomes,
          expenses: cloudExpenses,
        }));
      }
    };

    fetchCloudTransactions();

    // Suscripción en tiempo real (Sincronización instantánea entre celulares)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          fetchCloudTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Guardar resto de configuración en LocalStorage (categorías, metas, etc.)
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
      frequents: (d.frequents || []).filter((f) => f.categoryId !== id),
      recurring: (d.recurring || []).filter((r) => !(r.kind === 'expense' && r.categoryId === id)),
    }));
  }, []);

  // Agregar Gasto a Supabase
  const addExpense = useCallback(async (exp) => {
    const { data: newRow, error } = await supabase.from('transactions').insert([
      {
        type: 'expense',
        amount: exp.amount,
        category_id: exp.categoryId,
        date: exp.date,
        note: exp.note,
      },
    ]).select();

    if (!error && newRow && newRow[0]) {
      const inserted = newRow[0];
      setData((d) => ({
        ...d,
        expenses: [...d.expenses, { id: inserted.id, amount: Number(inserted.amount), categoryId: inserted.category_id, date: inserted.date, note: inserted.note }],
      }));
    }
  }, []);

  // Eliminar Gasto de Supabase
  const deleteExpense = useCallback(async (id) => {
    await supabase.from('transactions').delete().eq('id', id);
    setData((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));
  }, []);

  // Agregar Ingreso a Supabase
  const addIncome = useCallback(async (inc) => {
    const { data: newRow, error } = await supabase.from('transactions').insert([
      {
        type: 'income',
        amount: inc.amount,
        source: inc.source,
        date: inc.date,
        note: inc.note,
      },
    ]).select();

    if (!error && newRow && newRow[0]) {
      const inserted = newRow[0];
      setData((d) => ({
        ...d,
        incomes: [...d.incomes, { id: inserted.id, amount: Number(inserted.amount), source: inserted.source, date: inserted.date, note: inserted.note }],
      }));
    }
  }, []);

  // Eliminar Ingreso de Supabase
  const deleteIncome = useCallback(async (id) => {
    await supabase.from('transactions').delete().eq('id', id);
    setData((d) => ({ ...d, incomes: d.incomes.filter((i) => i.id !== id) }));
  }, []);

  const addGoal = useCallback((goal) => {
    setData((d) => ({ ...d, goals: [...d.goals, { id: uid(), currentAmount: 0, ...goal }] }));
  }, []);

  const updateGoal = useCallback((id, updates) => {
    setData((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) }));
  }, []);

  const deleteGoal = useCallback((id) => {
    setData((d) => {
      const isAutoSaveTarget = d.autoSaveGoalId === id;
      return {
        ...d,
        goals: d.goals.filter((g) => g.id !== id),
        ...(isAutoSaveTarget ? { autoSaveGoalId: null, autoSaveEnabled: false } : {}),
      };
    });
  }, []);

  const resetAll = useCallback(async () => {
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setData({ currency: data.currency, incomes: [], expenses: [], categories: [], goals: [], frequents: [], recurring: [], notificationsEnabled: false, notifiedThresholds: {}, autoSaveEnabled: false, autoSaveGoalId: null, autoSavedMonths: {} });
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
    addExpense({ amount: Number(freq.amount), categoryId: freq.categoryId, date: today, note: freq.note || freq.name });
  }, [addExpense]);

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

  const addRecurring = useCallback((rec) => {
    setData((d) => ({
      ...d,
      recurring: [...(d.recurring || []), { id: uid(), active: true, lastAppliedMonth: null, ...rec }],
    }));
  }, []);

  const updateRecurring = useCallback((id, updates) => {
    setData((d) => ({
      ...d,
      recurring: (d.recurring || []).map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  }, []);

  const deleteRecurring = useCallback((id) => {
    setData((d) => ({ ...d, recurring: (d.recurring || []).filter((r) => r.id !== id) }));
  }, []);

  const applyPendingRecurring = useCallback(() => {
    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const list = data.recurring || [];
    const eligible = list.filter((r) => {
      if (!r.active) return false;
      if (r.lastAppliedMonth === curMonth) return false;
      if (r.kind === 'expense' && !r.categoryId) return false;
      const effectiveDay = Math.min(Number(r.dayOfMonth) || 1, daysInMonth);
      return today >= effectiveDay;
    });

    if (eligible.length === 0) return 0;

    const eligibleIds = new Set(eligible.map((r) => r.id));

    eligible.forEach((r) => {
      const effectiveDay = Math.min(Number(r.dayOfMonth) || 1, daysInMonth);
      const date = `${curMonth}-${String(effectiveDay).padStart(2, '0')}`;
      const note = r.note ? `${r.note} (recurrente)` : 'Recurrente';
      if (r.kind === 'income') {
        addIncome({ amount: Number(r.amount), source: r.source || r.name, date, note });
      } else {
        addExpense({ amount: Number(r.amount), categoryId: r.categoryId, date, note });
      }
    });

    setData((d) => ({
      ...d,
      recurring: (d.recurring || []).map((r) => (eligibleIds.has(r.id) ? { ...r, lastAppliedMonth: curMonth } : r)),
    }));

    return eligible.length;
  }, [data.recurring, addIncome, addExpense]);

  const setAutoSaveEnabled = useCallback((v) => {
    setData((d) => ({ ...d, autoSaveEnabled: !!v }));
  }, []);

  const setAutoSaveGoal = useCallback((goalId) => {
    setData((d) => ({ ...d, autoSaveGoalId: goalId || null }));
  }, []);

  const applyPendingAutoSave = useCallback(() => {
    if (!data.autoSaveEnabled || !data.autoSaveGoalId) return [];
    const goal = data.goals.find((g) => g.id === data.autoSaveGoalId);
    if (!goal) return [];

    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthsSet = new Set();
    data.incomes.forEach((i) => { const m = monthKey(i.date); if (m) monthsSet.add(m); });
    data.expenses.forEach((e) => { const m = monthKey(e.date); if (m) monthsSet.add(m); });

    const closedMonths = Array.from(monthsSet)
      .filter((m) => m < curMonth)
      .sort();

    const already = data.autoSavedMonths || {};
    const applied = [];

    closedMonths.forEach((m) => {
      if (already[m]) return;
      const totalIn = data.incomes.filter((i) => monthKey(i.date) === m).reduce((s, i) => s + Number(i.amount), 0);
      const totalOut = data.expenses.filter((e) => monthKey(e.date) === m).reduce((s, e) => s + Number(e.amount), 0);
      const leftover = totalIn - totalOut;
      if (leftover > 0) {
        applied.push({ month: m, amount: leftover });
      } else {
        applied.push({ month: m, amount: 0, skipped: true });
      }
    });

    const actuallyApplied = applied.filter((a) => !a.skipped);
    if (applied.length === 0) return [];

    setData((d) => {
      const newAutoSaved = { ...(d.autoSavedMonths || {}) };
      let totalAdded = 0;
      applied.forEach((a) => {
        newAutoSaved[a.month] = {
          goalId: d.autoSaveGoalId,
          goalName: goal.name,
          amount: a.amount,
          date: new Date().toISOString().slice(0, 10),
          skipped: !!a.skipped,
        };
        if (!a.skipped) totalAdded += a.amount;
      });
      const newGoals = d.goals.map((g) =>
        g.id === d.autoSaveGoalId ? { ...g, currentAmount: Number(g.currentAmount || 0) + totalAdded } : g
      );
      return { ...d, autoSavedMonths: newAutoSaved, goals: newGoals };
    });

    return actuallyApplied;
  }, [data.autoSaveEnabled, data.autoSaveGoalId, data.goals, data.incomes, data.expenses, data.autoSavedMonths]);

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

  const previousMonth = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonth]);

  const previousMonthly = useMemo(() => {
    const incomes = data.incomes.filter((i) => monthKey(i.date) === previousMonth);
    const expenses = data.expenses.filter((e) => monthKey(e.date) === previousMonth);
    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const balance = totalIncome - totalExpense;
    const byCategory = data.categories.map((cat) => {
      const spent = expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + Number(e.amount), 0);
      return { ...cat, spent };
    });
    return { month: previousMonth, incomes, expenses, totalIncome, totalExpense, balance, byCategory };
  }, [data, previousMonth]);

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
    addRecurring,
    updateRecurring,
    deleteRecurring,
    applyPendingRecurring,
    setAutoSaveEnabled,
    setAutoSaveGoal,
    applyPendingAutoSave,
    previousMonth,
    previousMonthly,
  };
}