import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function labelForMonth(m) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  const names = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${names[Number(mo) - 1] || mo} ${y}`;
}

function buildMonthList(availableMonths) {
  // Generate a rolling list: last 12 months + all available months
  const now = new Date();
  const list = new Set(availableMonths || []);
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return Array.from(list).sort().reverse();
}

export default function MonthSelector({ selectedMonth, onChange, availableMonths }) {
  const months = buildMonthList(availableMonths);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline">Mes:</span>
      <Select value={selectedMonth} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] font-medium" data-testid="month-selector">
          <SelectValue placeholder="Selecciona mes" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={m} data-testid={`month-opt-${m}`}>
              {labelForMonth(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
