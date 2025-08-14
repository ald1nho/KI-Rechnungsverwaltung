import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReceiptStorage } from '@/hooks/use-receipt-storage';
import { CATEGORY_LABELS } from '@/types/receipt';
import { TrendingUp, Receipt, Euro, Calendar, BarChart3 } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';

const Dashboard: React.FC = () => {
  const { receipts, isLoading } = useReceiptStorage();

  const totalAmount = useMemo(() => {
    if (!receipts || receipts.length === 0) return 0;
    return receipts.reduce((s, r) => s + (r.amount || 0), 0);
  }, [receipts]);

  const avgMonthly = useMemo(() => {
    if (!receipts || receipts.length === 0) return 0;
    const monthsSet = new Set();
    receipts.forEach(r => {
      try {
        const monthKey = new Date(r.date).toISOString().slice(0, 7);
        monthsSet.add(monthKey);
      } catch (error) {
        console.warn('Invalid date:', r.date);
      }
    });
    if (monthsSet.size === 0) return 0;
    return totalAmount / monthsSet.size;
  }, [receipts, totalAmount]);

  const byMonth = useMemo(() => {
    if (!receipts || receipts.length === 0) return [];
    
    const map: Record<string, number> = {};
    receipts.forEach(r => {
      try {
        const monthKey = new Date(r.date).toISOString().slice(0, 7); // YYYY-MM
        map[monthKey] = (map[monthKey] || 0) + (r.amount || 0);
      } catch (error) {
        console.warn('Invalid date:', r.date);
      }
    });
    
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ 
        month: k, 
        monthLabel: new Date(k + '-01').toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        sum: Number(v.toFixed(2)) 
      }));
  }, [receipts]);

  const byCategory = useMemo(() => {
    if (!receipts || receipts.length === 0) return [];
    
    const map: Record<string, number> = {};
    receipts.forEach(r => {
      if (r.category && r.amount) {
        map[r.category] = (map[r.category] || 0) + r.amount;
      }
    });
    
    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        label: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category,
        amount: Number(amount.toFixed(2)),
        percentage: totalAmount > 0 ? Number(((amount / totalAmount) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [receipts, totalAmount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Dashboard wird geladen...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Übersicht Ihrer Rechnungen und Ausgaben</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 gradient-card shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gesamtsumme</p>
              <p className="text-2xl font-bold">{totalAmount.toLocaleString('de-DE', { 
                style: 'currency', 
                currency: 'EUR' 
              })}</p>
              <p className="text-xs text-muted-foreground mt-1">Alle Rechnungen</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Euro className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 gradient-card shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Anzahl Belege</p>
              <p className="text-2xl font-bold">{receipts?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Gespeicherte Dokumente</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 gradient-card shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Durchschnitt/Monat</p>
              <p className="text-2xl font-bold">{avgMonthly.toLocaleString('de-DE', { 
                style: 'currency', 
                currency: 'EUR' 
              })}</p>
              <p className="text-xs text-muted-foreground mt-1">Monatliche Ausgaben</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 gradient-card shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Letzter Beleg</p>
              <p className="text-2xl font-bold">
                {receipts && receipts.length > 0 
                  ? new Date(receipts[0].date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
                  : '-'
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {receipts && receipts.length > 0 
                  ? new Date(receipts[0].date).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
                  : 'Noch kein Beleg'
                }
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      {!receipts || receipts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Noch keine Daten vorhanden</h3>
            <p className="text-muted-foreground mb-4">
              Fügen Sie Ihre ersten Rechnungen hinzu, um detaillierte Statistiken und Grafiken zu sehen.
            </p>
            <Badge variant="outline" className="text-sm">
              Gehen Sie zu "Rechnungen" um Belege hinzuzufügen
            </Badge>
          </div>
        </Card>
      ) : (
        <>
          {/* Monthly Trend Chart */}
          <Card className="p-6 gradient-card shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Monatliche Ausgaben</h3>
                <p className="text-sm text-muted-foreground">Entwicklung über Zeit</p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Trend
              </Badge>
            </div>
            <div className="h-[400px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={byMonth} 
                  margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="fillSum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 12 }}
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`€${value}`, 'Ausgaben']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sum" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fill="url(#fillSum)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Distribution Chart */}
          {byCategory.length > 0 && (
            <Card className="p-6 gradient-card shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Ausgaben nach Kategorien</h3>
                  <p className="text-sm text-muted-foreground">Verteilung der Ausgaben</p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Kategorien
                </Badge>
              </div>
              <div className="h-[400px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={120}
                      paddingAngle={3}
                      dataKey="amount"
                    >
                      {byCategory.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`hsl(${(index * 45) % 360}, 70%, 50%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `€${value}`,
                        props.payload?.label || name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {byCategory.map((item, index) => (
                  <div key={item.category} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${(index * 45) % 360}, 70%, 50%)` }}
                    />
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="ml-auto font-medium">€{item.amount}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Monthly Bar Chart */}
          {byMonth.length > 1 && (
            <Card className="p-6 gradient-card shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Monatliche Ausgaben Vergleich</h3>
                  <p className="text-sm text-muted-foreground">Detaillierte Monatsansicht</p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Balken
                </Badge>
              </div>
              <div className="h-[400px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={byMonth} 
                    margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="monthLabel" 
                      tick={{ fontSize: 12 }}
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`€${value}`, 'Ausgaben']}
                    />
                    <Bar 
                      dataKey="sum" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="text-lg font-semibold mb-4">Rechnungen Übersicht</div>
            <div className="text-sm text-muted-foreground">
              Sie haben {receipts.length} Beleg{receipts.length === 1 ? '' : 'e'} mit einer Gesamtsumme von {totalAmount.toFixed(2)} € gespeichert.
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;