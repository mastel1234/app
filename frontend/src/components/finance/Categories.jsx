import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { formatMoney } from '@/lib/currency';

const COLOR_OPTIONS = [
  '#2C5F4A', '#4B8B6B', '#D89A3F', '#C4623C', '#5B7FA0',
  '#8B6BAE', '#7A9E4F', '#B84A5F', '#3C7A89', '#A67C52',
];

function CategoryDialog({ open, onOpenChange, onSave, initial, currency }) {
  const [name, setName] = useState(initial?.name || '');
  const [limit, setLimit] = useState(initial?.monthlyLimit?.toString() || '');
  const [color, setColor] = useState(initial?.color || COLOR_OPTIONS[0]);

  const submit = () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    const lim = parseFloat(limit) || 0;
    onSave({ name: name.trim(), monthlyLimit: lim, color });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="category-dialog">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          <DialogDescription>Define tus propias categorías con un límite mensual.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cat-name">Nombre</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Supermercado, Gasolina…" data-testid="category-name-input" />
          </div>
          <div>
            <Label htmlFor="cat-limit">Límite mensual ({currency})</Label>
            <Input id="cat-limit" type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0.00 = sin límite" data-testid="category-limit-input" />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-md border-2 transition-transform hover:scale-110 ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  data-testid={`color-${c}`}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} data-testid="category-save-btn">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Categories({ finance }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const currency = finance.data.currency;

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (cat) => { setEditing(cat); setDialogOpen(true); };

  const handleSave = (payload) => {
    if (editing) {
      finance.updateCategory(editing.id, payload);
      toast.success('Categoría actualizada');
    } else {
      finance.addCategory(payload);
      toast.success('Categoría creada');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar esta categoría? También se eliminarán sus gastos asociados.')) {
      finance.deleteCategory(id);
      toast.success('Categoría eliminada');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Categorías</h2>
          <p className="text-sm text-muted-foreground">Personaliza los apartados de tus gastos y sus límites mensuales.</p>
        </div>
        <Button onClick={openAdd} data-testid="new-category-btn">
          <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
        </Button>
      </div>

      {finance.monthly.byCategory.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4" data-testid="empty-categories">
              No tienes categorías todavía. Crea una para empezar a controlar tus gastos.
            </p>
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> Crear primera categoría
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {finance.monthly.byCategory.map((c) => {
            const pct = c.monthlyLimit > 0 ? Math.min(c.percent, 100) : 0;
            return (
              <Card key={c.id} className="card-hover shadow-sm" data-testid={`category-card-${c.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <h3 className="font-display font-semibold text-base leading-tight">{c.name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} data-testid={`edit-cat-${c.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c.id)} data-testid={`delete-cat-${c.id}`}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <span className="text-xl font-bold tabular-nums">{formatMoney(c.spent, currency)}</span>
                    {c.monthlyLimit > 0 && (
                      <span className="text-xs text-muted-foreground">de {formatMoney(c.monthlyLimit, currency)}</span>
                    )}
                  </div>
                  {c.monthlyLimit > 0 ? (
                    <>
                      <Progress value={pct} className={c.over ? '[&>div]:bg-destructive' : ''} />
                      <div className={`mt-3 rounded-md px-3 py-2 text-sm ${c.over ? 'bg-destructive/10 text-destructive' : 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'}`} data-testid={`available-${c.id}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {c.over ? 'Excedido' : 'Disponible'}
                          </span>
                          <span className="text-base font-bold tabular-nums">
                            {formatMoney(Math.abs(c.monthlyLimit - c.spent), currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs opacity-80">
                          {c.over && <AlertTriangle className="w-3 h-3" />}
                          <span>{Math.round(c.percent)}% del límite usado</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin límite mensual definido</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        initial={editing}
        currency={currency}
      />
    </div>
  );
}
