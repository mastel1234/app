import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export function monthKey(dateStr) {
  return (dateStr || '').slice(0, 7); // YYYY-MM
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useFinance() {
  const [data, setData] = useState({
    currency: 'DOP',
    incomes: [],
    expenses: [],
    categories: [],
    goals: [],
    frequents: [],
    recurring: [],
    notificationsEnabled: false,
    notifiedThresholds: {},
    autoSaveEnabled: false,
    autoSaveGoalId: null,
    autoSavedMonths: {},
  });

  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  // 1. Carga inicial de TODOS los datos desde Supabase y sincronización en tiempo real
  const fetchAllCloudData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Obtener transacciones, categorías y metas asociadas al usuario logueado
    const [txRes, catRes, goalRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
    ]);

    const cloudTx = txRes.data || [];
    const cloudCat = catRes.data || [];
    const cloudGoals = goalRes.data || [];

    const cloudIncomes = cloudTx
      .filter((t) => t.type === 'income')
      .map((t) => ({ id: t.id, amount: Number(t.amount), source: t.source, date: t.date, note: t.note }));

    const cloudExpenses = cloudTx
      .filter((t) => t.type === 'expense')
      .map((t) => ({ id: t.id, amount: Number(t.amount), categoryId: t.category_id, date: t.date, note: t.note }));

    const mappedCategories = cloudCat.map((c) => ({
      id: c.id,
      name: c.name,
      monthlyLimit: Number(c.budget || c.monthlyLimit || 0),
      color: c.color || '#4B8B6B',
      icon: c.icon,
    }));

    const mappedGoals = cloudGoals.map((g) => ({
      id: g.id,
      name: g.name || g.title,
      targetAmount: Number(g.target_amount || g.targetAmount || 0),
      currentAmount: Number(g.current_amount || g.currentAmount || 0),
    }));

    setData((prev) => ({
      ...prev,
      incomes: cloudIncomes,
      expenses: cloudExpenses,
      categories: mappedCategories,
      goals: mappedGoals,
    }));
  }, []);

  useEffect(() => {
    fetchAllCloudData();

    // Canales de suscripción en tiempo real para reflejar cambios instantáneos en ambos celulares
    const channelTx = supabase
      .channel('realtime-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchAllCloudData)
      .subscribe();

    const channelCat = supabase
      .channel('realtime-categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchAllCloudData)
      .subscribe();

    const channelGoals = supabase
      .channel('realtime-goals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, fetchAllCloudData)
      .subscribe();

    return () => {
      supabase.removeChannel(channelTx);
      supabase.removeChannel(channelCat);
      supabase.removeChannel(channelGoals);
    };
  }, [fetchAllCloudData]);

  // --- CATEGORÍAS (Sincronizadas con Supabase) ---
  const addCategory = useCallback(async (cat) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('categories').insert([
      {
        user_id: user.id,
        name: cat.name,
        budget: cat.monthlyLimit || 0,
        color: cat.color || '#4B8B6B',
      },
    ]);

    if (!error) fetchAllCloudData();
  }, [fetchAllCloudData]);

  const updateCategory = useCallback(async (id, updates) => {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.monthlyLimit !== undefined) payload.budget = updates.monthlyLimit;
    if (updates.color !== undefined) payload.color = updates.color;

    const { error } = await supabase.from('categories').update(payload).eq('id', id);
    if (!error) fetchAllCloudData();
  }, [fetchAllCloudData]);

  const deleteCategory = useCallback(async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchAllCloudData();
  }, [fetchAllCloudData]);

  // --- MOVIMIENTOS (Gastos e Ingresos) ---
  const addExpense = useCallback(async (exp) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('transactions').insert([
      {
        user_id: user.id,
        type: 'expense',
        amount: exp.amount,
        category_id: exp.categoryId,
        date: exp.date,
        note: exp.note,
      },
    ]);

    if (!error) fetchAllCloudData();
  }, [fetchAllCloudData]);

  const deleteExpense = useCallback(async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) fetchAllCloudData();
  }, [fetchAllCloudData]);

  const addIncome = useCallback(async (inc) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('transactions').insert([
      {
        user_id: user.id,
        type: 'income',
        amount: inc.amount,
        source: inc.source,
        date: inc.date,
        note: inc.note,
      },
    ]);

    if (!error) fetchAllCloudData();
  }, [fetchAllCloudData]);

  const deleteIncome = useCallback(async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) fetchAllCloudData();
  }, [fetchAllCloudData]);

  // --- METAS DE AHORRO (Sincronizadas con Supabase) ---
  const addGoal = useCallback(async (goal) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('goals').insert([
      {
        user_id: user.id,
        title: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount || 0,
      },
    ]);

    if (!error) fetchAllCloudData();
  }, [fetchAllCloudData]);

  const updateGoal = useCallback(async (id, updates) => {
    const payload = {};
    if (updates.name !== undefined) payload.title = updates.name;
    if (updates.targetAmount !== undefined) payload.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) payload.current_amount = updates.currentAmount;

    const { error } = await supabase.from('goals').update(payload).eq('id', id);
    if (!error) fetchAllCloudData();
  }, [fetchAllCloudData]);

  const deleteGoal = useCallback(async (id) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (!error) fetchAllCloudData();
  }, [fetchAllCloudData]);

  // --- AJUSTES Y HERRAMIENTAS MANTENIDAS ---
  const setCurrency = useCallback((currency) => {
    setData((d) => ({ ...d, currency }));
  }, []);

  const resetAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await Promise.all([
      supabase.from('transactions').delete().eq('user_id', user.id),
      supabase.from('categories').delete().eq('user_id', user.id),
      supabase.from('goals').delete().eq('user_id', user.id),
    ]);

    fetchAllCloudData();
  }, [fetchAllCloudData]);

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

  const setAutoSaveEnabled = useCallback((v) => {
    setData((d) => ({ ...d, autoSaveEnabled: !!v }));
  }, []);

  const setAutoSaveGoal = useCallback((goalId) => {
    setData((d) => ({ ...d, autoSaveGoalId: goalId || null }));
  }, []);

  const applyPendingRecurring = useCallback(() => 0, []);
  const applyPendingAutoSave = useCallback(() => [], []);

  // --- CÁLCULOS MENSUALES Y PROYECCIONES ---
  const monthly = useMemo(() => {
    const incomes = data.incomes.filter((i) => monthKey(i.date) === selectedMonth);
    const expenses = data.expenses.filter((e) => monthKey(e.date) === selectedMonth);
    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const balance = totalIncome - totalExpense;

    const byCategory = data.categories.map((cat) => {
      const spent = expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + Number(e.amount), 0);
      const pct = cat.monthlyLimit > 0 ? (spent / cat.monthlyLimit) * 100 : 0;
      return { ...cat, spent, percent: pct, over: cat.monthlyLimit > 0 && spent > cat.monthlyLimit };
    });

    const overLimit = byCategory.filter((c) => c.over);

    return { incomes, expenses, goals: data.goals, totalIncome, totalExpense, balance, byCategory, overLimit };
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
    setNotificationsEnabled,
    markThresholdNotified,
    applyPendingRecurring,
    setAutoSaveEnabled,
    setAutoSaveGoal,
    applyPendingAutoSave,
    previousMonth,
    previousMonthly,
  };
}