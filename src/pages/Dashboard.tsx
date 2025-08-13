import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReceiptStorage } from '@/hooks/use-receipt-storage';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6'];

const Dashboard: React.FC = () => {
  const { receipts } = useReceiptStorage();

  const totalAmount = useMemo(() => receipts.reduce((s, r) => s + (r.amount || 0), 0), [receipts]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    receipts.forEach(r => {
      const key = format(new Date(r.date), 'yyyy-MM', { locale: de });
      map[key] = (map[key] || 0) + (r.amount || 0);
    });
    return Object.entries(map)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([k, v]) => ({ month: k, sum: Number(v.toFixed(2)) }));
  }, [receipts]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    receipts.forEach(r => {
      const key = r.category || 'other';
      map[key] = (map[key] || 0) + (r.amount || 0);
    });
    return Object.entries(map).map(([k, v]) => ({ name: k, value: Number(v.toFixed(2)) }));
  }, [receipts]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 gradient-card shadow-card">
          <div className="text-sm text-muted-foreground">Gesamtsumme</div>
          <div className="text-3xl font-bold mt-2">{totalAmount.toFixed(2)} €</div>
          <div className="text-xs text-muted-foreground mt-1">Summe aller gespeicherten Rechnungen</div>
        </Card>
        <Card className="p-6 gradient-card shadow-card">
          <div className="text-sm text-muted-foreground">Anzahl Belege</div>
          <div className="text-3xl font-bold mt-2">{receipts.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Gesamtanzahl</div>
        </Card>
        <Card className="p-6 gradient-card shadow-card">
          <div className="text-sm text-muted-foreground">Letzter Beleg</div>
          <div className="text-lg font-semibold mt-2">{receipts[0] ? format(new Date(receipts[0].date), 'dd.MM.yyyy', { locale: de }) : '-'}</div>
          <div className="text-xs text-muted-foreground mt-1">Zuletzt hinzugefügt</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 gradient-card shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Monatssummen</div>
            <Badge variant="secondary">pro Monat</Badge>
          </div>
          <ChartContainer config={{ sum: { label: 'Summe', color: 'hsl(var(--primary))' } }}>
            <AreaChart data={byMonth} margin={{ left: 12, right: 12, top: 12 }}>
              <defs>
                <linearGradient id="fillSum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis width={40} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="sum" stroke="hsl(var(--primary))" fill="url(#fillSum)" />
            </AreaChart>
          </ChartContainer>
        </Card>

        <Card className="p-4 gradient-card shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Kategorien</div>
            <Badge variant="secondary">Verteilung</Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {byCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4 gradient-card shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Summen nach Monat (Balken)</div>
          <Badge variant="secondary">Trend</Badge>
        </div>
        <ChartContainer config={{ sum: { label: 'Summe', color: 'hsl(var(--primary))' } }}>
          <BarChart data={byMonth}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis width={40} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="sum" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  );
};

export default Dashboard;


