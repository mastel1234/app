import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMoney } from '@/lib/currency';
import FrequentExpenses from '@/components/finance/FrequentExpenses';
import RecurringTransactions from '@/components/finance/RecurringTransactions';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function AddTransactionDialog({ finance, type, onOpenChange, open }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [categoryId, setCategoryId] = useState('');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');

  const reset = () => {
    setAmount('');
    setDate(todayStr());
    setCategoryId('');
    setSource('');
    setNote('');
  };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (type === 'expense') {
      if (!categoryId) {
        toast.error('Selecciona una categoría');
        return;
      }
      finance.addExpense({ amount: amt, categoryId, date, note });
      toast.success('Gasto registrado');
    } else {
      finance.addIncome({ amount: amt, source: source || 'Ingreso', date, note });
      toast.success('Ingreso registrado');
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent data-testid={`add-${type}-dialog`}>
        <DialogHeader>
          <DialogTitle>{type === 'expense' ? 'Nuevo Gasto' : 'Nuevo Ingreso'}</DialogTitle>
          <DialogDescription>
            {type === 'expense' ? 'Registra un gasto en una de tus categorías.' : 'Registra un ingreso mensual.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tx-amount">Monto ({finance.data.currency})</Label>
            <Input
              id="tx-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              data-testid={`${type}-amount-input`}
            />
          </div>
          {type === 'expense' ? (
            <div>
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger data-testid="expense-category-select"><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                <SelectContent>
                  {finance.data.categories.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Crea una categoría primero</div>
                  )}
                  {finance.data.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="income-source">Fuente</Label>
              <Input
                id="income-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Ej: Salario, Freelance…"
                data-testid="income-source-input"
              />
            </div>
          )}
          <div>
            <Label htmlFor="tx-date">Fecha</Label>
            <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid={`${type}-date-input`} />
          </div>
          <div>
            <Label htmlFor="tx-note">Nota (opcional)</Label>
            <Textarea id="tx-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} data-testid={`${type}-note-input`} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} data-testid={`${type}-submit-btn`}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Transactions({ finance }) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  const catMap = Object.fromEntries(finance.data.categories.map((c) => [c.id, c]));
  const currency = finance.data.currency;

  const rows = [
    ...finance.monthly.incomes.map((i) => ({
      id: 'i-' + i.id,
      raw: i,
      kind: 'income',
      date: i.date,
      label: i.source || 'Ingreso',
      amount: i.amount,
      note: i.note,
    })),
    ...finance.monthly.expenses.map((e) => ({
      id: 'e-' + e.id,
      raw: e,
      kind: 'expense',
      date: e.date,
      label: (catMap[e.categoryId] && catMap[e.categoryId].name) || 'Sin categoría',
      color: (catMap[e.categoryId] && catMap[e.categoryId].color) || '#999',
      amount: e.amount,
      note: e.note,
    })),
  ]
    .filter((r) => filter === 'all' || r.kind === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Movimientos</h2>
          <p className="text-sm text-muted-foreground">Registra tus ingresos y gastos del mes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIncomeOpen(true)} data-testid="add-income-btn">
            <ArrowUpCircle className="w-4 h-4 mr-2 text-[hsl(var(--success))]" />
            Ingreso
          </Button>
          <Button onClick={() => setExpenseOpen(true)} data-testid="add-expense-btn">
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            Gasto
          </Button>
        </div>
      </div>

      <FrequentExpenses finance={finance} />

      <RecurringTransactions finance={finance} />

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg font-display">Historial del mes</CardTitle>
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList data-testid="transaction-filter-tabs">
                <TabsTrigger value="all" data-testid="filter-all">Todos</TabsTrigger>
                <TabsTrigger value="income" data-testid="filter-income">Ingresos</TabsTrigger>
                <TabsTrigger value="expense" data-testid="filter-expense">Gastos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground" data-testid="empty-transactions">
              No hay movimientos este mes. Añade tu primer ingreso o gasto.
            </p>
          ) : (
            <Table data-testid="transactions-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría / Fuente</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} data-testid={`tx-row-${r.id}`}>
                    <TableCell className="tabular-nums text-sm">{r.date}</TableCell>
                    <TableCell>
                      {r.kind === 'income' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--success))]">
                          <ArrowUpCircle className="w-3.5 h-3.5" /> Ingreso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                          <ArrowDownCircle className="w-3.5 h-3.5" /> Gasto
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {r.color && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />}
                        <span className="font-medium">{r.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">{r.note || '—'}</TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${r.kind === 'income' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                      {r.kind === 'income' ? '+' : '−'} {formatMoney(r.amount, currency)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (r.kind === 'income') finance.deleteIncome(r.raw.id);
                          else finance.deleteExpense(r.raw.id);
                          toast.success('Movimiento eliminado');
                        }}
                        data-testid={`delete-tx-${r.raw.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddTransactionDialog finance={finance} type="expense" open={expenseOpen} onOpenChange={setExpenseOpen} />
      <AddTransactionDialog finance={finance} type="income" open={incomeOpen} onOpenChange={setIncomeOpen} />
    </div>
  );
}
