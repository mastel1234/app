import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, ArrowUpCircle, ArrowDownCircle, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatMoney } from '@/lib/currency';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function QuickAddFAB({ finance }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null); // 'expense' | 'income' | 'frequent'
  const [visible, setVisible] = useState(true);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const lastScrollY = useRef(0);
  const hideTimer = useRef(null);

  // Hide FAB on scroll down, show on scroll up or scroll stop.
  // This avoids the fixed FAB blocking hit-targets in the middle of the page.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;
      if (menuOpen || dialogType !== null) return;
      if (delta > 4 && y > 80) setVisible(false);
      else if (delta < -4) setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(true), 800);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [menuOpen, dialogType]);

  const currency = finance.data.currency;
  const categories = finance.monthly.byCategory;
  const selectedCat = categories.find((c) => c.id === categoryId);
  const frequents = finance.data.frequents || [];
  const catMap = Object.fromEntries(finance.data.categories.map((c) => [c.id, c]));

  const openDialog = (type) => {
    setDialogType(type);
    setMenuOpen(false);
    setAmount('');
    setCategoryId('');
    setSource('');
    setNote('');
  };

  const close = () => setDialogType(null);

  const applyFrequent = (f) => {
    const cat = catMap[f.categoryId];
    finance.applyFrequent(f);
    if (cat && cat.monthlyLimit > 0) {
      const spent = finance.monthly.expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + Number(e.amount), 0);
      const rem = cat.monthlyLimit - (spent + Number(f.amount));
      if (rem < 0) toast.error(`Excedido "${cat.name}" por ${formatMoney(-rem, currency)}`);
      else toast.success(`Registrado. Disponible en "${cat.name}": ${formatMoney(rem, currency)}`);
    } else {
      toast.success('Registrado');
    }
    close();
  };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    const date = todayStr();
    if (dialogType === 'expense') {
      if (!categoryId) {
        toast.error('Selecciona una categoría');
        return;
      }
      finance.addExpense({ amount: amt, categoryId, date, note });
      const cat = categories.find((c) => c.id === categoryId);
      if (cat && cat.monthlyLimit > 0) {
        const newSpent = cat.spent + amt;
        const remaining = cat.monthlyLimit - newSpent;
        if (remaining < 0) {
          toast.error(`Excediste "${cat.name}" por ${formatMoney(-remaining, currency)}`, { duration: 5000 });
        } else {
          toast.success(`Gasto registrado. Disponible en "${cat.name}": ${formatMoney(remaining, currency)}`);
        }
      } else {
        toast.success('Gasto registrado');
      }
    } else {
      finance.addIncome({ amount: amt, source: source || 'Ingreso', date, note });
      toast.success('Ingreso registrado');
    }
    close();
  };

  return (
    <>
      <div
        className={`fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3 transition-all duration-300 ${visible || menuOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-24 opacity-0 pointer-events-none'}`}
        data-testid="fab-container"
      >
        {menuOpen && (
          <div className="flex flex-col gap-2 stagger-in">
            {frequents.length > 0 && (
              <button
                onClick={() => openDialog('frequent')}
                className="flex items-center gap-2 bg-card border border-border rounded-full pl-4 pr-5 py-2.5 shadow-lg hover:-translate-y-0.5 transition-transform"
                data-testid="fab-frequent-btn"
              >
                <Zap className="w-5 h-5 text-[hsl(var(--warning))]" />
                <span className="text-sm font-semibold">Frecuente</span>
              </button>
            )}
            <button
              onClick={() => openDialog('income')}
              className="flex items-center gap-2 bg-card border border-border rounded-full pl-4 pr-5 py-2.5 shadow-lg hover:-translate-y-0.5 transition-transform"
              data-testid="fab-income-btn"
            >
              <ArrowUpCircle className="w-5 h-5 text-[hsl(var(--success))]" />
              <span className="text-sm font-semibold">Ingreso</span>
            </button>
            <button
              onClick={() => openDialog('expense')}
              className="flex items-center gap-2 bg-card border border-border rounded-full pl-4 pr-5 py-2.5 shadow-lg hover:-translate-y-0.5 transition-transform"
              data-testid="fab-expense-btn"
            >
              <ArrowDownCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm font-semibold">Gasto</span>
            </button>
          </div>
        )}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
          data-testid="fab-toggle"
          aria-label="Añadir movimiento"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      <Dialog open={dialogType !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent data-testid="quick-add-dialog">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'expense' && 'Registrar Gasto'}
              {dialogType === 'income' && 'Registrar Ingreso'}
              {dialogType === 'frequent' && 'Gastos Frecuentes'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'expense' && 'Se descontará automáticamente del límite de la categoría elegida.'}
              {dialogType === 'income' && 'Se sumará al total de ingresos del mes.'}
              {dialogType === 'frequent' && 'Toca uno para registrarlo con la fecha de hoy.'}
            </DialogDescription>
          </DialogHeader>

          {dialogType === 'frequent' ? (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto" data-testid="fab-frequent-list">
              {frequents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No tienes gastos frecuentes. Créalos en la pestaña "Movimientos".
                </p>
              ) : (
                frequents.map((f) => {
                  const cat = catMap[f.categoryId];
                  return (
                    <button
                      key={f.id}
                      onClick={() => applyFrequent(f)}
                      className="w-full text-left rounded-md border border-border bg-secondary/40 p-3 hover:-translate-y-0.5 hover:shadow-md transition-transform"
                      data-testid={`fab-frequent-${f.id}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {cat && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}
                            <span className="font-semibold text-sm truncate">{f.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{cat?.name || 'Sin categoría'}</span>
                        </div>
                        <span className="text-lg font-display font-bold tabular-nums shrink-0">{formatMoney(f.amount, currency)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fab-amount">Monto ({currency})</Label>
              <Input
                id="fab-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-2xl h-14 font-display font-bold tabular-nums"
                data-testid="fab-amount-input"
              />
            </div>
            {dialogType === 'expense' ? (
              <>
                <div>
                  <Label>Categoría</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger data-testid="fab-category-select">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Crea una categoría primero</div>
                      )}
                      {categories.map((c) => {
                        const rem = c.monthlyLimit - c.spent;
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                              <span>{c.name}</span>
                              {c.monthlyLimit > 0 && (
                                <span className={`text-xs ml-auto pl-3 ${rem < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {rem < 0 ? 'Excedido' : 'Disp.'}: {formatMoney(Math.abs(rem), currency)}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCat && selectedCat.monthlyLimit > 0 && (
                  <div className="rounded-md border border-border bg-secondary/50 p-3 text-sm" data-testid="fab-remaining-hint">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Disponible antes:</span>
                      <span className="font-semibold tabular-nums">{formatMoney(Math.max(selectedCat.monthlyLimit - selectedCat.spent, 0), currency)}</span>
                    </div>
                    {amount && !isNaN(parseFloat(amount)) && (
                      <div className="flex justify-between pt-1 border-t border-border">
                        <span className="text-muted-foreground">Disponible después:</span>
                        <span className={`font-semibold tabular-nums ${selectedCat.monthlyLimit - selectedCat.spent - parseFloat(amount) < 0 ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>
                          {formatMoney(selectedCat.monthlyLimit - selectedCat.spent - parseFloat(amount), currency)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div>
                <Label htmlFor="fab-source">Fuente</Label>
                <Input
                  id="fab-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Ej: Salario, Freelance…"
                  data-testid="fab-source-input"
                />
              </div>
            )}
            <div>
              <Label htmlFor="fab-note">Nota (opcional)</Label>
              <Input id="fab-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe brevemente…" data-testid="fab-note-input" />
            </div>
          </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            {dialogType !== 'frequent' && (
              <Button onClick={submit} data-testid="fab-submit-btn">Guardar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
