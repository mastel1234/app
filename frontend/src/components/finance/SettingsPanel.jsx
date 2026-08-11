import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, Upload, RotateCcw, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES } from '@/lib/currency';
import { exportCSV, exportPDF } from '@/lib/exportData';
import { exportJSON, importJSON } from '@/lib/storage';
import { isNotificationSupported, requestNotificationPermission } from '@/hooks/useBudgetNotifications';

export default function SettingsPanel({ finance }) {
  const fileRef = useRef(null);
  const [permission, setPermission] = useState(isNotificationSupported() ? Notification.permission : 'unsupported');

  const toggleNotifications = async (checked) => {
    if (checked) {
      if (!isNotificationSupported()) {
        toast.error('Tu navegador no soporta notificaciones');
        return;
      }
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res === 'granted') {
        finance.setNotificationsEnabled(true);
        toast.success('Notificaciones activadas. Te avisaremos al 80% y 100% del límite.');
      } else if (res === 'denied') {
        toast.error('Permiso denegado. Actívalo en la configuración del navegador.');
      }
    } else {
      finance.setNotificationsEnabled(false);
      toast.success('Notificaciones desactivadas');
    }
  };

  const handleCSV = () => {
    exportCSV({
      month: finance.selectedMonth,
      incomes: finance.monthly.incomes,
      expenses: finance.monthly.expenses,
      categories: finance.data.categories,
      currency: finance.data.currency,
    });
    toast.success('CSV exportado');
  };

  const handlePDF = () => {
    exportPDF({
      month: finance.selectedMonth,
      incomes: finance.monthly.incomes,
      expenses: finance.monthly.expenses,
      categories: finance.data.categories,
      currency: finance.data.currency,
      summary: {
        totalIncome: finance.monthly.totalIncome,
        totalExpense: finance.monthly.totalExpense,
        balance: finance.monthly.balance,
      },
    });
    toast.success('PDF generado');
  };

  const handleExportJSON = () => {
    const blob = new Blob([exportJSON(finance.data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup descargado');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = importJSON(reader.result);
        finance.importAll(next);
        toast.success('Datos importados correctamente');
      } catch {
        toast.error('Archivo inválido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
      finance.resetAll();
      toast.success('Datos reiniciados');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-display font-bold">Ajustes</h2>
        <p className="text-sm text-muted-foreground">Configura la moneda y gestiona tus datos.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            {finance.data.notificationsEnabled && permission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            Notificaciones
          </CardTitle>
          <CardDescription>Recibe alertas cuando una categoría llegue al 80% o 100% de su límite.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="notif-toggle" className="text-base font-medium">Activar alertas</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Estado: <span className="font-semibold">
                  {permission === 'granted' && finance.data.notificationsEnabled && 'Activas'}
                  {permission === 'granted' && !finance.data.notificationsEnabled && 'Desactivadas'}
                  {permission === 'denied' && 'Bloqueadas por el navegador'}
                  {permission === 'default' && 'Sin permiso otorgado'}
                  {permission === 'unsupported' && 'No soportado en este navegador'}
                </span>
              </p>
            </div>
            <Switch
              id="notif-toggle"
              checked={finance.data.notificationsEnabled && permission === 'granted'}
              onCheckedChange={toggleNotifications}
              disabled={permission === 'unsupported'}
              data-testid="notifications-toggle"
            />
          </div>
          {permission === 'denied' && (
            <p className="text-xs text-destructive mt-3">
              Activa los permisos de notificación en tu navegador (icono de candado junto a la URL) y recarga.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-display">Moneda</CardTitle>
          <CardDescription>La moneda se aplica a todos los montos e informes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Moneda actual</Label>
          <Select value={finance.data.currency} onValueChange={finance.setCurrency}>
            <SelectTrigger className="w-full sm:w-[280px] mt-2" data-testid="currency-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code} data-testid={`currency-opt-${c.code}`}>
                  {c.symbol} — {c.name} ({c.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-display">Exportar datos del mes</CardTitle>
          <CardDescription>Descarga los movimientos del mes seleccionado ({finance.selectedMonth}).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleCSV} variant="outline" data-testid="export-csv-btn">
            <Download className="w-4 h-4 mr-2" /> Descargar CSV
          </Button>
          <Button onClick={handlePDF} variant="outline" data-testid="export-pdf-btn">
            <FileText className="w-4 h-4 mr-2" /> Generar PDF
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-display">Copia de seguridad</CardTitle>
          <CardDescription>Guarda o restaura todos tus datos como archivo JSON.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleExportJSON} variant="outline" data-testid="backup-btn">
            <Download className="w-4 h-4 mr-2" /> Descargar backup
          </Button>
          <Button onClick={() => fileRef.current?.click()} variant="outline" data-testid="restore-btn">
            <Upload className="w-4 h-4 mr-2" /> Restaurar backup
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleImportJSON} className="hidden" data-testid="restore-input" />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg font-display text-destructive">Zona peligrosa</CardTitle>
          <CardDescription>Esto eliminará permanentemente todas tus categorías, transacciones y metas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleReset} data-testid="reset-btn">
            <RotateCcw className="w-4 h-4 mr-2" /> Reiniciar todos los datos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
