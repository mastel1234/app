import { AlertTriangle, TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { formatMoney } from '@/lib/currency';
import MonthlyComparison from '@/components/finance/MonthlyComparison';

function KpiCard({ label, value, icon: Icon, tone = 'default', testId }) {
  const tones = {
    default: 'bg-card',
    success: 'bg-card border-l-4 border-l-[hsl(var(--success))]',
    danger: 'bg-card border-l-4 border-l-[hsl(var(--destructive))]',
    warning: 'bg-card border-l-4 border-l-[hsl(var(--warning))]',
    primary: 'bg-card border-l-4 border-l-primary',
  };
  return (
    <Card className={`card-hover shadow-sm ${tones[tone]}`} data-testid={testId}>
      <CardContent className="p-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl sm:text-3xl font-display font-bold mt-2 tabular-nums" data-testid={`${testId}-value`}>
            {value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard({ finance, onGoToCategories }) {
  const { monthly, data } = finance;
  const currency = data.currency;
  const savingsRate = monthly.totalIncome > 0 ? Math.round((monthly.balance / monthly.totalIncome) * 100) : 0;

  const barData = monthly.byCategory.map((c) => ({
    id: c.id,
    name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    Gastado: Math.round(c.spent),
    Límite: Math.round(c.monthlyLimit),
    over: c.over,
  }));

  const pieData = monthly.byCategory
    .filter((c) => c.spent > 0)
    .map((c) => ({ id: c.id, name: c.name, value: Math.round(c.spent), color: c.color }));

  const CHART_COLORS = ['#2C5F4A', '#4B8B6B', '#D89A3F', '#C4623C', '#5B7FA0', '#8B6BAE'];

  return (
    <div className="space-y-6">
      {monthly.overLimit.length > 0 && (
        <Alert variant="destructive" data-testid="over-limit-alert">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Categorías fuera de presupuesto</AlertTitle>
          <AlertDescription>
            Has superado el límite en: <strong>{monthly.overLimit.map((c) => c.name).join(', ')}</strong>.
            <Button variant="link" className="px-1 h-auto text-destructive-foreground underline" onClick={onGoToCategories}>
              Revisar categorías
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard label="Ingresos del mes" value={formatMoney(monthly.totalIncome, currency)} icon={TrendingUp} tone="success" testId="kpi-income" />
        <KpiCard label="Gastos del mes" value={formatMoney(monthly.totalExpense, currency)} icon={TrendingDown} tone="danger" testId="kpi-expense" />
        <KpiCard label="Balance" value={formatMoney(monthly.balance, currency)} icon={Wallet} tone={monthly.balance >= 0 ? 'primary' : 'warning'} testId="kpi-balance" />
        <KpiCard label="Tasa de ahorro" value={`${savingsRate}%`} icon={PiggyBank} tone={savingsRate >= 20 ? 'success' : savingsRate >= 0 ? 'warning' : 'danger'} testId="kpi-savings-rate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display" data-testid="chart-vs-limit-title">Gastos vs Límite por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
                Aún no tienes categorías. Crea una en la pestaña &ldquo;Categorías&rdquo;.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip formatter={(v) => formatMoney(v, currency)} />
                  <Legend />
                  <Bar dataKey="Límite" fill="hsl(var(--muted-foreground))" opacity={0.35} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastado" radius={[4, 4, 0, 0]}>
                    {barData.map((entry) => (
                      <Cell key={`bar-${entry.id}`} fill={entry.over ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display">Distribución</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">Sin gastos este mes</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {pieData.map((entry, i) => (
                      <Cell key={`pie-${entry.id}`} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(v, currency)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-display">Progreso por Categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {monthly.byCategory.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay categorías creadas todavía.</p>
          )}
          {monthly.byCategory.map((c) => {
            const pct = c.monthlyLimit > 0 ? Math.min(c.percent, 100) : 0;
            return (
              <div key={c.id} data-testid={`cat-progress-${c.id}`}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-medium">{c.name}</span>
                    {c.over && <span className="text-xs text-destructive font-semibold ml-1">EXCEDIDO</span>}
                  </div>
                  <span className="tabular-nums text-muted-foreground">
                    {formatMoney(c.spent, currency)} {c.monthlyLimit > 0 && <span>/ {formatMoney(c.monthlyLimit, currency)}</span>}
                  </span>
                </div>
                <Progress value={pct} className={c.over ? '[&>div]:bg-destructive' : ''} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <MonthlyComparison finance={finance} />
    </div>
  );
}
