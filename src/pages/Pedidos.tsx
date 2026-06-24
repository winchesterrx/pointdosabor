import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Clock, CheckCircle2, ChevronLeft, Package, Truck, XCircle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/menu/BottomNav";
import { getOrdersByLookup, fetchOrdersByLookup } from "@/data/menuData";
import type { Order, OrderStatus } from "@/data/menuData";

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
  recebido: { label: "Recebido", icon: ClipboardList, color: "text-blue-500 bg-blue-500/10" },
  confirmado: { label: "Confirmado", icon: CheckCircle2, color: "text-cyan-500 bg-cyan-500/10" },
  preparando: { label: "Preparando", icon: Clock, color: "text-amber-500 bg-amber-500/10" },
  pronto: { label: "Pronto", icon: Package, color: "text-emerald-500 bg-emerald-500/10" },
  entregue: { label: "Entregue", icon: Truck, color: "text-muted-foreground bg-muted" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "text-destructive bg-destructive/10" },
};

const timelineOrder: OrderStatus[] = ["recebido", "confirmado", "preparando", "pronto", "entregue"];

export default function Pedidos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem("digitalmenu_customer_cpf") || "");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  const formatInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    if (digits.length === 11 && digits[2] === "9") {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return digits;
  };

  const cleanTerm = searchTerm.replace(/\D/g, "");

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', cleanTerm],
    queryFn: () => fetchOrdersByLookup(cleanTerm),
    enabled: cleanTerm.length >= 10 && cleanTerm.length <= 13,
    refetchInterval: 5000
  });

  const loadOrders = () => {
    if (cleanTerm.length >= 10 && cleanTerm.length <= 13) {
      localStorage.setItem("digitalmenu_customer_cpf", cleanTerm);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return isToday ? `Hoje, ${time}` : `${d.toLocaleDateString("pt-BR")}, ${time}`;
  };

  return (
    <div className="min-h-screen bg-background pb-24 w-full overflow-x-hidden">
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/")} className="p-1 rounded-full active:bg-primary-foreground/20">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-xl font-display">Meus Pedidos</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm ml-9">Acompanhe seus pedidos</p>
      </div>

      {/* Search Input */}
      <div className="px-4 mt-4">
        <div className="flex gap-2">
          <input
            value={formatInput(searchTerm)}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="CPF ou Celular/WhatsApp"
            className="flex-1 border border-border rounded-xl p-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={loadOrders} className="bg-primary text-primary-foreground px-4 rounded-xl">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Orders */}
      <div className="px-4 mt-4 space-y-3">
        {orders.map((order) => {
          const st = statusConfig[order.status];
          const StatusIcon = st.icon;
          const isExpanded = expandedOrder === order.id;

          return (
            <div key={order.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-primary">Pedido #{order.number}</span>
                    <span className="text-xs text-muted-foreground ml-2">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${st.color}`}>
                    <StatusIcon size={12} />
                    {st.label}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                </p>
                <p className="text-primary font-bold text-sm mt-1">R$ {order.total.toFixed(2)}</p>
              </button>

              {isExpanded && (
                <div className="border-t border-border p-4 space-y-4">
                  {/* Items detail */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Itens</h4>
                    {order.items.map((item, i) => (
                      <div key={i} className="text-sm text-foreground mb-1">
                        <span className="font-medium">{item.quantity}x {item.productName}</span>
                        <span className="text-muted-foreground ml-1">R$ {(item.productPrice * item.quantity).toFixed(2)}</span>
                        {item.addons.length > 0 && (
                          <p className="text-xs text-muted-foreground ml-4">
                            + {item.addons.map((a) => `${a.quantity}x ${a.name}`).join(", ")}
                          </p>
                        )}
                        {item.notes && <p className="text-xs text-muted-foreground ml-4 italic">"{item.notes}"</p>}
                      </div>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>🛒 {order.consumeType} {order.address && `· ${order.address}`} {order.mesa && `· Mesa ${order.mesa}`}</p>
                    <p>💳 {order.paymentMethod}</p>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Linha do Tempo</h4>
                    <div className="space-y-0">
                      {timelineOrder.map((status, i) => {
                        const entry = order.timeline.find((t) => t.status === status);
                        const isCurrent = order.status === status;
                        const isPast = entry !== undefined;
                        const isCancelled = order.status === "cancelado";

                        return (
                          <div key={status} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full border-2 ${
                                isCurrent ? "bg-primary border-primary" :
                                isPast ? "bg-primary/50 border-primary/50" :
                                "bg-muted border-border"
                              }`} />
                              {i < timelineOrder.length - 1 && (
                                <div className={`w-0.5 h-6 ${isPast ? "bg-primary/30" : "bg-border"}`} />
                              )}
                            </div>
                            <div className="-mt-0.5">
                              <p className={`text-xs font-medium ${isCurrent ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"}`}>
                                {statusConfig[status].label}
                              </p>
                              {entry && (
                                <p className="text-[10px] text-muted-foreground">
                                  {formatDate(entry.timestamp)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {isCancelled(order) && (
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full bg-destructive border-2 border-destructive" />
                          <p className="text-xs font-medium text-destructive -mt-0.5">Cancelado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center py-16">
            <ClipboardList size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {cleanTerm.length >= 10 ? "Nenhum pedido encontrado" : "Informe seu CPF ou Celular para ver seus pedidos"}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function isCancelled(order: Order): boolean {
  return order.status === "cancelado";
}
