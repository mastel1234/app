import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatMoney } from '@/lib/currency';

function labelForMonth(m) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${names[Number(mo) - 1] || mo} ${y}`;
}

function diffLabel(current, previous) {
  if (previous === 0) {
    if (current === 0) return { label: 'sin cambios', tone: 'neutral', pct: 0 };
    return { label: 'Nuevo', tone: current > 0 ? 'up' : 'down', pct: 100 };
  }
  const diff = ((current - previous) / Math.abs(previous)) * 100;
  const tone = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
  return { label: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`, tone, pct: diff };
}

function DeltaTag({ current, previous, invertColors = false, testId }) {
  const d = diffLabel(current, previous);
  let color = 'text-muted-foreground';
  let Icon = Minus;
  if (d.tone === 'up') {
    Icon = TrendingUp;
    color = invertColors ? 'text-destructive' : 'text-[hsl(var(--success))]';
  } else if (d.tone === 'down') {
    Icon = TrendingDown;
    color = invertColors ? 'text-[hsl(var(--success))]' : 'text-destructive';
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${color}`} data-testid={testId}>
      <Icon className="w-3 h-3" />
      {d.label}
    </span>
  );
}

export default function MonthlyComparison({ finance }) {
  const currency = finance.data.currency;
  const cur = finance.monthly;
  const prev = finance.previousMonthly;

  const chartData = [
    {
      name: labelForMonth(finance.previousMonth),
      Ingresos: Math.round(prev.totalIncome),
      Gastos: Math.round(prev.totalExpense),
      Balance: Math.round(prev.balance),
    },
    {
      name: labelForMonth(finance.selectedMonth),
      Ingresos: Math.round(cur.totalIncome),
      Gastos: Math.round(cur.totalExpense),
      Balance: Math.round(cur.balance),
    },
  ];

  const hasAnyData = prev.totalIncome + prev.totalExpense + cur.totalIncome + cur.totalExpense > 0;

  return (
    <Card className="shadow-sm" data-testid="monthly-comparison-card">
      <CardHeader>
        <CardTitle className="text-lg font-display">Comparación Mensual</CardTitle>
        <CardDescription>
          {labelForMonth(finance.previousMonth)} vs {labelForMonth(finance.selectedMonth)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAnyData ? (
          <p className="text-sm text-muted-foreground text-center py-8" data-testid="comparison-empty">
            Aún no hay datos para comparar entre meses.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-md border border-border bg-secondary/30 p-3" data-testid="compare-income">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Ingresos</p>
                <p className="text-xl font-display font-bold tabular-nums mt-1">{formatMoney(cur.totalIncome, currency)}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">vs {formatMoney(prev.totalIncome, currency)}</span>
                  <DeltaTag current={cur.totalIncome} previous={prev.totalIncome} testId="delta-income" />
                </div>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-3" data-testid="compare-expense">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Gastos</p>
                <p className="text-xl font-display font-bold tabular-nums mt-1">{formatMoney(cur.totalExpense, currency)}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">vs {formatMoney(prev.totalExpense, currency)}</span>
                  <DeltaTag current={cur.totalExpense} previous={prev.totalExpense} invertColors testId="delta-expense" />
                </div>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-3" data-testid="compare-balance">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Balance</p>
                <p className={`text-xl font-display font-bold tabular-nums mt-1 ${cur.balance < 0 ? 'text-destructive' : ''}`}>{formatMoney(cur.balance, currency)}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">vs {formatMoney(prev.balance, currency)}</span>
                  <DeltaTag current={cur.balance} previous={prev.balance} testId="delta-balance" />
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip formatter={(v) => formatMoney(v, currency)} />
                <Legend />
                <Bar dataKey="Ingresos" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Balance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
