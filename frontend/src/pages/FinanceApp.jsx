import { useState, useEffect, useRef } from 'react';
import { Wallet, LayoutDashboard, ArrowRightLeft, Tags, Target, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useFinance } from '@/hooks/useFinance';
import { useBudgetNotifications } from '@/hooks/useBudgetNotifications';
import Dashboard from '@/components/finance/Dashboard';
import Transactions from '@/components/finance/Transactions';
import Categories from '@/components/finance/Categories';
import Goals from '@/components/finance/Goals';
import SettingsPanel from '@/components/finance/SettingsPanel';
import MonthSelector from '@/components/finance/MonthSelector';
import QuickAddFAB from '@/components/finance/QuickAddFAB';
import { CURRENCIES } from '@/lib/currency';

export default function FinanceApp() {
  const finance = useFinance();
  const [tab, setTab] = useState('dashboard');
  const currentCurrency = CURRENCIES.find((c) => c.code === finance.data.currency) || CURRENCIES[0];
  useBudgetNotifications(finance);

  // Auto-apply pending recurring transactions on load
  const didRunRecurring = useRef(false);
  useEffect(() => {
    if (didRunRecurring.current) return;
    if (!finance.data.recurring) return;
    didRunRecurring.current = true;
    const count = finance.applyPendingRecurring();
    if (count > 0) {
      setTimeout(() => {
        toast.success(`Se aplicaron ${count} transacción(es) recurrente(s) de este mes.`);
      }, 0);
    }
  }, [finance]);

  // Auto-save leftover balance of closed months to selected goal
  const didRunAutoSave = useRef(false);
  useEffect(() => {
    if (didRunAutoSave.current) return;
    if (!finance.data.autoSaveEnabled || !finance.data.autoSaveGoalId) return;
    didRunAutoSave.current = true;
    const applied = finance.applyPendingAutoSave();
    if (applied && applied.length > 0) {
      const total = applied.reduce((s, a) => s + a.amount, 0);
      setTimeout(() => {
        toast.success(`Ahorro automático: se transfirieron ${applied.length} mes(es) cerrado(s) a tu meta.`, {
          description: `Total ahorrado: ${new Intl.NumberFormat('es-DO', { style: 'currency', currency: finance.data.currency }).format(total)}`,
          duration: 6000,
        });
      }, 100);
    }
  }, [finance]);

  return (
    <div className="min-h-screen bg-background" data-testid="finance-app">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl leading-tight" data-testid="app-title">
                Mis Finanzas
              </h1>
              <p className="text-xs text-muted-foreground">
                Control mensual de ingresos y gastos · {currentCurrency.code} ({currentCurrency.symbol})
              </p>
            </div>
          </div>
          <MonthSelector
            selectedMonth={finance.selectedMonth}
            onChange={finance.setSelectedMonth}
            availableMonths={finance.availableMonths}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-6 sm:mb-8" data-testid="finance-tabs">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Panel</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">
              <ArrowRightLeft className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Movimientos</span>
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">
              <Tags className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Categorías</span>
            </TabsTrigger>
            <TabsTrigger value="goals" data-testid="tab-goals">
              <Target className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Metas</span>
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings2 className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Ajustes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="stagger-in">
            <Dashboard finance={finance} onGoToCategories={() => setTab('categories')} />
          </TabsContent>
          <TabsContent value="transactions" className="stagger-in">
            <Transactions finance={finance} />
          </TabsContent>
          <TabsContent value="categories" className="stagger-in">
            <Categories finance={finance} />
          </TabsContent>
          <TabsContent value="goals" className="stagger-in">
            <Goals finance={finance} />
          </TabsContent>
          <TabsContent value="settings" className="stagger-in">
            <SettingsPanel finance={finance} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-40 sm:pb-6 text-center text-xs text-muted-foreground">
        Sincronizado en tiempo real con la nube · Mis Finanzas
      </footer>

      <QuickAddFAB finance={finance} />
    </div>
  );
}