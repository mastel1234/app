import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Zap, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatMoney } from '@/lib/currency';

function FrequentDialog({ open, onOpenChange, onSave, initial, categories, currency }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setAmount(initial?.amount != null ? initial.amount.toString() : '');
      setCategoryId(initial?.categoryId || '');
      setNote(initial?.note || '');
    }
  }, [open, initial]);

  const submit = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || !categoryId) {
      toast.error('Completa nombre y categoría');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    onSave({ name: name.trim(), amount: amt, categoryId, note });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="frequent-dialog">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Gasto Frecuente' : 'Nuevo Gasto Frecuente'}</DialogTitle>
          <DialogDescription>Guarda gastos que se repiten para registrarlos con un toque.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fq-name">Nombre</Label>
            <Input id="fq-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Café de la mañana, Pasaje…" data-testid="frequent-name-input" />
          </div>
          <div>
            <Label htmlFor="fq-amount">Monto ({currency})</Label>
            <Input id="fq-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="frequent-amount-input" />
          </div>
          <div>
            <Label>Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger data-testid="frequent-category-select"><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
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
          <div>
            <Label htmlFor="fq-note">Nota (opcional)</Label>
            <Input id="fq-note" value={note} onChange={(e) => setNote(e.target.value)} data-testid="frequent-note-input" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} data-testid="frequent-save-btn">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FrequentExpenses({ finance }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const frequents = finance.data.frequents || [];
  const categories = finance.data.categories;
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const currency = finance.data.currency;

  const openAdd = () => { setEditing(null); setOpen(true); };
  const openEdit = (f) => { setEditing(f); setOpen(true); };

  const save = (payload) => {
    if (editing) {
      finance.updateFrequent(editing.id, payload);
      toast.success('Gasto frecuente actualizado');
    } else {
      finance.addFrequent(payload);
      toast.success('Gasto frecuente guardado');
    }
  };

  const applyOne = (f) => {
    const cat = catMap[f.categoryId];
    finance.applyFrequent(f);
    if (cat && cat.monthlyLimit > 0) {
      const spent = finance.monthly.expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + Number(e.amount), 0);
      const rem = cat.monthlyLimit - (spent + Number(f.amount));
      if (rem < 0) {
        toast.error(`Excedido "${cat.name}" por ${formatMoney(-rem, currency)}`);
      } else {
        toast.success(`Registrado. Disponible en "${cat.name}": ${formatMoney(rem, currency)}`);
      }
    } else {
      toast.success('Registrado');
    }
  };

  const del = (id) => {
    if (window.confirm('¿Eliminar este gasto frecuente?')) {
      finance.deleteFrequent(id);
      toast.success('Eliminado');
    }
  };

  return (
    <Card className="shadow-sm" data-testid="frequents-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Zap className="w-4 h-4 text-[hsl(var(--warning))]" /> Gastos Frecuentes
          </CardTitle>
          <CardDescription>Toca uno para registrarlo hoy con un solo toque.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={openAdd} data-testid="new-frequent-btn">
          <Plus className="w-4 h-4 mr-1.5" /> Nuevo
        </Button>
      </CardHeader>
      <CardContent>
        {frequents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6" data-testid="empty-frequents">
            No tienes gastos frecuentes aún. Guarda los que repites cada semana.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {frequents.map((f) => {
              const cat = catMap[f.categoryId];
              return (
                <div
                  key={f.id}
                  className="group relative rounded-md border border-border bg-secondary/40 p-3 pr-20 card-hover cursor-pointer"
                  onClick={() => applyOne(f)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyOne(f); } }}
                  role="button"
                  tabIndex={0}
                  data-testid={`frequent-item-${f.id}`}
                  aria-label={`Registrar ${f.name} por ${formatMoney(f.amount, currency)}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {cat && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}
                    <span className="font-semibold text-sm truncate">{f.name}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-display font-bold tabular-nums">{formatMoney(f.amount, currency)}</span>
                    <span className="text-xs text-muted-foreground truncate ml-2">{cat?.name || 'Sin categoría'}</span>
                  </div>
                  <div className="flex gap-1 absolute top-1.5 right-1.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(f); }} data-testid={`edit-frequent-${f.id}`} aria-label={`Editar ${f.name}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); del(f.id); }} data-testid={`delete-frequent-${f.id}`} aria-label={`Eliminar ${f.name}`}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <FrequentDialog
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
