const STORAGE_KEY = 'finance_tracker_data_v1';

const defaultData = {
  currency: 'DOP',
  incomes: [], // { id, amount, source, date, note }
  expenses: [], // { id, amount, categoryId, date, note }
  categories: [], // { id, name, color, monthlyLimit }
  goals: [], // { id, name, targetAmount, currentAmount, month (YYYY-MM), note }
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed };
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportJSON(data) {
  return JSON.stringify(data, null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  return { ...defaultData, ...parsed };
}
