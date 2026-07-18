import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "@/data/menuData";
import { BarChart3, TrendingUp, Package, Clock, DollarSign } from "lucide-react";

export default function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60000 // refresh every minute
  });

  if (isLoading) {
    return <div className="p-10 flex justify-center text-muted-foreground">Carregando dashboard...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <DollarSign className="text-green-500" size={20} />
            <span className="font-medium text-sm">Faturamento do Dia</span>
          </div>
          <h3 className="text-3xl font-bold text-foreground">R$ {stats.revenue.today?.toFixed(2) || "0.00"}</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <TrendingUp className="text-blue-500" size={20} />
            <span className="font-medium text-sm">Faturamento do Mês</span>
          </div>
          <h3 className="text-3xl font-bold text-foreground">R$ {stats.revenue.month?.toFixed(2) || "0.00"}</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Package className="text-orange-500" size={20} />
            <span className="font-medium text-sm">Total de Pedidos (Dia)</span>
          </div>
          <h3 className="text-3xl font-bold text-foreground">{stats.ordersCount || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <BarChart3 className="text-primary" size={20} />
            <h3 className="font-semibold text-foreground">Produtos Mais Vendidos (Mês)</h3>
          </div>
          {stats.topProducts && stats.topProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.topProducts.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-foreground">{p.name}</span>
                  <span className="font-bold text-primary">{p.total_quantity}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum dado disponível.</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <Clock className="text-primary" size={20} />
            <h3 className="font-semibold text-foreground">Horários de Pico (Mês)</h3>
          </div>
          {stats.peakHours && stats.peakHours.length > 0 ? (
            <div className="space-y-3">
              {stats.peakHours.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-foreground">{p.hour}:00</span>
                  <span className="font-bold text-primary">{p.order_count} pedidos</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum dado disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
}
