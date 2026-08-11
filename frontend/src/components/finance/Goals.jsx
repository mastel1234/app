import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Target, Pencil, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { formatMoney } from '@/lib/currency';

function GoalDialog({ open, onOpenChange, onSave, initial, currency, defaultMonth }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [month, setMonth] = useState(defaultMonth);

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setTarget(initial?.targetAmount != null ? initial.targetAmount.toString() : '');
      setCurrent(initial?.currentAmount != null ? initial.currentAmount.toString() : '0');
      setMonth(initial?.month || defaultMonth);
    }
  }, [open, initial, defaultMonth]);

  const submit = () => {
    if (!name.trim() || !target) {
      toast.error('Completa nombre y meta');
      return;
    }
    onSave({
      name: name.trim(),
      targetAmount: parseFloat(target) || 0,
      currentAmount: parseFloat(current) || 0,
      month,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="goal-dialog">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Meta' : 'Nueva Meta de Ahorro'}</DialogTitle>
          <DialogDescription>Define cuánto quieres ahorrar este mes y ve tu progreso.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="goal-name">Nombre de la meta</Label>
            <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Fondo de emergencia, Viaje…" data-testid="goal-name-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="goal-target">Objetivo ({currency})</Label>
              <Input id="goal-target" type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="goal-target-input" />
            </div>
            <div>
              <Label htmlFor="goal-current">Ahorrado ({currency})</Label>
              <Input id="goal-current" type="number" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} data-testid="goal-current-input" />
            </div>
          </div>
          <div>
            <Label htmlFor="goal-month">Mes (YYYY-MM)</Label>
            <Input id="goal-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} data-testid="goal-month-input" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} data-testid="goal-save-btn">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Goals({ finance }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const currency = finance.data.currency;

  const openAdd = () => { setEditing(null); setOpen(true); };
  const openEdit = (g) => { setEditing(g); setOpen(true); };

  const save = (payload) => {
    if (editing) {
      finance.updateGoal(editing.id, payload);
      toast.success('Meta actualizada');
    } else {
      finance.addGoal(payload);
      toast.success('Meta creada');
    }
  };

  const del = (id) => {
    if (window.confirm('¿Eliminar esta meta?')) {
      finance.deleteGoal(id);
      toast.success('Meta eliminada');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Metas de Ahorro</h2>
          <p className="text-sm text-muted-foreground">Establece objetivos mensuales y sigue tu progreso.</p>
        </div>
        <Button onClick={openAdd} data-testid="new-goal-btn">
          <Plus className="w-4 h-4 mr-2" /> Nueva Meta
        </Button>
      </div>

      {finance.monthly.goals.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4" data-testid="empty-goals">
              No hay metas para este mes. Crea una para empezar a ahorrar con propósito.
            </p>
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> Crear primera meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {finance.monthly.goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
            const done = g.currentAmount >= g.targetAmount && g.targetAmount > 0;
            return (
              <Card key={g.id} className="card-hover shadow-sm" data-testid={`goal-card-${g.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-lg">{g.name}</h3>
                      <p className="text-xs text-muted-foreground">Mes: {g.month}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(g)} data-testid={`edit-goal-${g.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => del(g.id)} data-testid={`delete-goal-${g.id}`}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-bold tabular-nums">{formatMoney(g.currentAmount, currency)}</span>
                    <span className="text-sm text-muted-foreground">de {formatMoney(g.targetAmount, currency)}</span>
                  </div>
                  <Progress value={pct} className={done ? '[&>div]:bg-[hsl(var(--success))]' : ''} />
                  <div className="flex justify-between text-xs mt-2">
                    <span className={done ? 'text-[hsl(var(--success))] font-semibold' : 'text-muted-foreground'}>
                      {done ? '¡Meta cumplida!' : `${Math.round(pct)}% completado`}
                    </span>
                    <span className="text-muted-foreground">
                      Falta: {formatMoney(Math.max(g.targetAmount - g.currentAmount, 0), currency)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <GoalDialog
        open={open}
        onOpenChange={setOpen}
        onSave={save}
        initial={editing}
        currency={currency}
        defaultMonth={finance.selectedMonth}
      />

      <AutoSaveHistory finance={finance} />
    </div>
  );
}

function AutoSaveHistory({ finance }) {
  const savedMonths = finance.data.autoSavedMonths || {};
  const entries = Object.entries(savedMonths).sort((a, b) => b[0].localeCompare(a[0]));
  const currency = finance.data.currency;
  if (entries.length === 0) return null;
  return (
    <Card className="shadow-sm" data-testid="autosave-history-card">
      <CardHeader>
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-primary" /> Historial de Ahorro Automático
        </CardTitle>
        <CardDescription>Cierres de mes procesados automáticamente.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map(([month, info]) => (
            <div
              key={month}
              className={`flex items-center justify-between rounded-md border border-border p-3 ${info.skipped ? 'bg-muted/40' : 'bg-[hsl(var(--success))]/10'}`}
              data-testid={`autosave-entry-${month}`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm">{month}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {info.skipped ? 'Sin sobrante para transferir' : `→ ${info.goalName || 'Meta'}`}
                </p>
              </div>
              <span className={`text-base font-display font-bold tabular-nums shrink-0 ${info.skipped ? 'text-muted-foreground' : 'text-[hsl(var(--success))]'}`}>
                {info.skipped ? '—' : `+ ${formatMoney(info.amount, currency)}`}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
