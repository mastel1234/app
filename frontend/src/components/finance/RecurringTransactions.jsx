import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Repeat, ArrowUpCircle, ArrowDownCircle, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatMoney } from '@/lib/currency';

function RecurringDialog({ open, onOpenChange, onSave, initial, categories, currency }) {
  const [kind, setKind] = useState('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [source, setSource] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setKind(initial?.kind || 'expense');
      setName(initial?.name || '');
      setAmount(initial?.amount != null ? initial.amount.toString() : '');
      setCategoryId(initial?.categoryId || '');
      setSource(initial?.source || '');
      setDayOfMonth(initial?.dayOfMonth != null ? String(initial.dayOfMonth) : '1');
      setNote(initial?.note || '');
    }
  }, [open, initial]);

  const submit = () => {
    const amt = parseFloat(amount);
    const day = parseInt(dayOfMonth, 10);
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!Number.isFinite(amt) || amt <= 0) { toast.error('El monto debe ser mayor a 0'); return; }
    if (!Number.isFinite(day) || day < 1 || day > 31) { toast.error('El día debe estar entre 1 y 31'); return; }
    if (kind === 'expense' && !categoryId) { toast.error('Selecciona una categoría'); return; }

    onSave({
      kind,
      name: name.trim(),
      amount: amt,
      dayOfMonth: day,
      note,
      ...(kind === 'expense' ? { categoryId, source: undefined } : { source: source.trim() || name.trim(), categoryId: undefined }),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="recurring-dialog">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Transacción Recurrente' : 'Nueva Transacción Recurrente'}</DialogTitle>
          <DialogDescription>Se registrará automáticamente cada mes en el día que definas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={kind === 'expense' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setKind('expense')}
              data-testid="recurring-kind-expense"
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" /> Gasto
            </Button>
            <Button
              type="button"
              variant={kind === 'income' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setKind('income')}
              data-testid="recurring-kind-income"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" /> Ingreso
            </Button>
          </div>
          <div>
            <Label htmlFor="rec-name">Nombre</Label>
            <Input id="rec-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'expense' ? 'Ej: Renta, Netflix…' : 'Ej: Sueldo, Alquiler cobrado…'} data-testid="recurring-name-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rec-amount">Monto ({currency})</Label>
              <Input id="rec-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="recurring-amount-input" />
            </div>
            <div>
              <Label htmlFor="rec-day">Día del mes</Label>
              <Input id="rec-day" type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} data-testid="recurring-day-input" />
            </div>
          </div>
          {kind === 'expense' ? (
            <div>
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger data-testid="recurring-category-select"><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Crea una categoría primero</div>}
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="rec-source">Fuente (opcional)</Label>
              <Input id="rec-source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ej: Empresa X" data-testid="recurring-source-input" />
            </div>
          )}
          <div>
            <Label htmlFor="rec-note">Nota (opcional)</Label>
            <Input id="rec-note" value={note} onChange={(e) => setNote(e.target.value)} data-testid="recurring-note-input" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} data-testid="recurring-save-btn">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RecurringTransactions({ finance }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const recurring = finance.data.recurring || [];
  const categories = finance.data.categories;
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const currency = finance.data.currency;

  const openAdd = () => { setEditing(null); setOpen(true); };
  const openEdit = (r) => { setEditing(r); setOpen(true); };

  const save = (payload) => {
    if (editing) {
      finance.updateRecurring(editing.id, payload);
      toast.success('Transacción recurrente actualizada');
    } else {
      finance.addRecurring(payload);
      toast.success('Transacción recurrente creada. Se aplicará automáticamente.');
    }
  };

  const del = (id) => {
    if (window.confirm('¿Eliminar esta transacción recurrente?')) {
      finance.deleteRecurring(id);
      toast.success('Eliminada');
    }
  };

  return (
    <Card className="shadow-sm" data-testid="recurring-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Repeat className="w-4 h-4 text-primary" /> Transacciones Recurrentes
          </CardTitle>
          <CardDescription>Sueldo, renta, servicios… se registran automáticamente cada mes.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={openAdd} data-testid="new-recurring-btn">
          <Plus className="w-4 h-4 mr-1.5" /> Nueva
        </Button>
      </CardHeader>
      <CardContent>
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6" data-testid="empty-recurring">
            No tienes transacciones recurrentes. Añade tu sueldo o gastos fijos.
          </p>
        ) : (
          <div className="space-y-2">
            {recurring.map((r) => {
              const cat = r.categoryId ? catMap[r.categoryId] : null;
              const isIncome = r.kind === 'income';
              return (
                <div
                  key={r.id}
                  className={`rounded-md border p-3 flex items-center gap-2 sm:gap-3 ${r.active ? 'bg-secondary/30 border-border' : 'bg-muted/30 border-border/50 opacity-70'}`}
                  data-testid={`recurring-item-${r.id}`}
                >
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md shrink-0 flex items-center justify-center ${isIncome ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]' : 'bg-destructive/15 text-destructive'}`}>
                    {isIncome ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{r.name}</span>
                      {cat && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Día {r.dayOfMonth} · {cat ? cat.name : (r.source || (isIncome ? 'Ingreso' : 'Gasto'))}
                    </div>
                    <span className={`text-sm sm:text-base font-display font-bold tabular-nums block sm:hidden mt-0.5 ${isIncome ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                      {isIncome ? '+' : '−'} {formatMoney(r.amount, currency)}
                    </span>
                  </div>
                  <span className={`hidden sm:inline text-base font-display font-bold tabular-nums shrink-0 ${isIncome ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                    {isIncome ? '+' : '−'} {formatMoney(r.amount, currency)}
                  </span>
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <Switch
                      checked={!!r.active}
                      onCheckedChange={(v) => finance.updateRecurring(r.id, { active: v })}
                      data-testid={`toggle-recurring-${r.id}`}
                      aria-label={r.active ? 'Pausar' : 'Activar'}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)} data-testid={`edit-recurring-${r.id}`} aria-label="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => del(r.id)} data-testid={`delete-recurring-${r.id}`} aria-label="Eliminar">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <RecurringDialog
        open={open}
        onOpenChange={setOpen}
        onSave={save}
        initial={editing}
        categories={categories}
        currency={currency}
      />
    </Card>
  );
}
