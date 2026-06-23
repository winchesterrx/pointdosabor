import { useState } from "react";
import { X, Minus, Plus, Trash2, MessageCircle, ChevronRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { addOrder, getNextOrderNumber, addOrderAsync, fetchCustomerPoints, fetchLoyaltySettings } from "@/data/menuData";
import type { Order, LoyaltySettings } from "@/data/menuData";
import { useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ConsumeOption = "entrega" | "retirada" | "mesa";
type PaymentOption = "credito" | "debito" | "pix" | "dinheiro";

export default function CheckoutModal({ isOpen, onClose }: Props) {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [consume, setConsume] = useState<ConsumeOption>("entrega");
  const [payment, setPayment] = useState<PaymentOption>("pix");
  const [address, setAddress] = useState("");
  const [mesa, setMesa] = useState("");
  const [customerWhatsApp, setCustomerWhatsApp] = useState("");
  const [customerCPF, setCustomerCPF] = useState("");
  
  // Loyalty states
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  useEffect(() => {
    fetchLoyaltySettings().then(setLoyaltySettings);
  }, []);

  useEffect(() => {
    if (customerCPF.replace(/\D/g, "").length === 11) {
      fetchCustomerPoints(customerCPF).then(points => {
        setCustomerPoints(points);
        if (points === 0) setUsePoints(false);
      });
    } else {
      setCustomerPoints(0);
      setUsePoints(false);
    }
  }, [customerCPF]);

  // Removed early return to allow AnimatePresence to handle exit animations

  const consumeLabels: Record<ConsumeOption, string> = {
    entrega: "Entrega", retirada: "Retirada", mesa: "Mesa",
  };
  const paymentLabels: Record<PaymentOption, string> = {
    credito: "Cartão de Crédito", debito: "Cartão de Débito", pix: "Pix", dinheiro: "Dinheiro",
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleFinalize = async () => {
    if (!customerWhatsApp.replace(/\D/g, "") || customerWhatsApp.replace(/\D/g, "").length < 10) {
      alert("Informe um número de WhatsApp válido.");
      return;
    }
    if (!customerCPF.replace(/\D/g, "") || customerCPF.replace(/\D/g, "").length < 11) {
      alert("Informe um CPF válido.");
      return;
    }

    let discountValue = 0;
    let pointsToUse = 0;
    if (usePoints && loyaltySettings && loyaltySettings.active && customerPoints > 0) {
      const pfd = Number(loyaltySettings.points_for_discount) || 1;
      const da = Number(loyaltySettings.discount_amount) || 0;
      const maxMultiplier = Math.floor(customerPoints / pfd);
      if (maxMultiplier > 0) {
        discountValue = maxMultiplier * da;
        pointsToUse = maxMultiplier * pfd;
        if (discountValue > total) {
          discountValue = total;
          pointsToUse = Math.ceil((total / da) * pfd);
        }
      }
    }
    const finalTotal = Math.max(0, total - discountValue);

    const orderNumber = getNextOrderNumber();
    const now = new Date().toISOString();

    const order: Order = {
      id: Date.now().toString(),
      number: orderNumber,
      items: items.map((item) => ({
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
        addons: item.selectedAddons.map((sa) => ({
          name: sa.addon.name,
          price: sa.addon.price,
          quantity: sa.quantity,
        })),
        notes: item.notes,
      })),
      total: finalTotal,
      consumeType: consumeLabels[consume],
      paymentMethod: paymentLabels[payment],
      address: consume === "entrega" ? address : "",
      mesa: consume === "mesa" ? mesa : "",
      customerWhatsApp: customerWhatsApp.replace(/\D/g, ""),
      customerCPF: customerCPF.replace(/\D/g, ""),
      status: "recebido",
      timeline: [{ status: "recebido", timestamp: now }],
      createdAt: now,
      usedPoints: pointsToUse,
      discountAmount: discountValue
    };

    // Save order via API
    try {
      const response = await addOrderAsync(order);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Erro desconhecido ao salvar o pedido.");
      }
    } catch (error: any) {
      console.error("Erro ao salvar o pedido no banco", error);
      alert(`⚠️ ATENÇÃO: Não foi possível registrar seu pedido no sistema: ${error.message}\n\nPor favor, tente novamente ou entre em contato com o restaurante.`);
      return; // Stop execution, don't open WhatsApp if DB save fails
    }

    // Save CPF for future lookups
    localStorage.setItem("digitalmenu_customer_cpf", order.customerCPF);

    // Build WhatsApp message
    const itemLines = items
      .map((item) => {
        const pPrice = Number(item.product.price) || 0;
        const iQty = Number(item.quantity) || 0;
        const aTotal = item.selectedAddons.reduce((s, sa) => s + (Number(sa.addon.price) || 0) * (Number(sa.quantity) || 0), 0);
        const itemFullTotal = (pPrice + aTotal) * iQty;
        
        let line = `• ${iQty}x ${item.product.name} - R$ ${itemFullTotal.toFixed(2)}`;
        if (item.selectedAddons.length > 0) {
          line += `\n  Adicionais: ${item.selectedAddons.map((sa) => `${sa.quantity}x ${sa.addon.name}`).join(", ")}`;
        }
        if (item.notes) line += `\n  Obs: ${item.notes}`;
        return line;
      })
      .join("\n");

    let locationInfo = "";
    if (consume === "entrega") locationInfo = `\n📍 Endereço: ${address}`;
    else if (consume === "mesa") locationInfo = `\n🪑 Mesa: ${mesa}`;

    let message = `🍽️ *NOVO PEDIDO #${orderNumber} - Bom Gosto Lanches*\n\n${itemLines}\n\n`;
    if (discountValue > 0) {
      message += `🎟️ Desconto Fidelidade: - R$ ${discountValue.toFixed(2)}\n`;
    }
    message += `💰 *Total: R$ ${finalTotal.toFixed(2)}*\n🛒 Consumo: ${consumeLabels[consume]}${locationInfo}\n💳 Pagamento: ${paymentLabels[payment]}\n📱 WhatsApp: ${customerWhatsApp}\n🪪 CPF: ${customerCPF}`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/5517997799982?text=${encoded}`, "_blank");

    clearCart();
    setStep("cart");
    setCustomerWhatsApp("");
    setCustomerCPF("");
    setAddress("");
    setMesa("");
    setUsePoints(false);
    onClose();
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const addonsTotal = items.reduce(
    (sum, item) => sum + item.selectedAddons.reduce((s, sa) => s + sa.addon.price * sa.quantity, 0) * item.quantity,
    0
  );

  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            key="checkout-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
      )}
      {isOpen && (
          <motion.div
            key="checkout-modal"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card z-[60] flex flex-col shadow-elevated"
          >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <h2 className="text-lg font-display tracking-wide">
              {step === "cart" ? "Seu Carrinho" : "Finalizar Pedido"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-primary-foreground/20 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === "cart" ? (
            <div className="p-5">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Seu carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 bg-muted/30 rounded-xl p-3 border border-border/50">
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-2xl">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-foreground truncate pr-2">{item.product.name}</h4>
                          <button onClick={() => removeItem(idx)} className="text-destructive shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {item.selectedAddons.length > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            + {item.selectedAddons.map((sa) => `${sa.quantity}x ${sa.addon.name}`).join(", ")}
                          </p>
                        )}
                        {item.notes && <p className="text-[11px] text-muted-foreground italic">"{item.notes}"</p>}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="bg-card rounded-full p-1 border border-border">
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="bg-card rounded-full p-1 border border-border">
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-primary">
                            R$ {((item.product.price + item.selectedAddons.reduce((s, sa) => s + sa.addon.price * sa.quantity, 0)) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Customer info */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Seus Dados</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">WhatsApp *</label>
                    <input
                      value={customerWhatsApp}
                      onChange={(e) => setCustomerWhatsApp(formatPhone(e.target.value))}
                      placeholder="(17) 99779-9982"
                      className="w-full border border-border rounded-xl p-3 text-sm bg-background text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">CPF *</label>
                    <input
                      value={customerCPF}
                      onChange={(e) => setCustomerCPF(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full border border-border rounded-xl p-3 text-sm bg-background text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    
                    {/* Fidelity Check Logic inline */}
                    {loyaltySettings?.active && (
                      <div className="mt-2 text-sm bg-primary/5 border border-primary/20 rounded-xl p-3">
                        {customerCPF.replace(/\D/g, "").length === 11 ? (
                          <div className="flex flex-col gap-2">
                            <span className="font-semibold text-primary">Saldo Fidelidade: {customerPoints} pontos</span>
                            {customerPoints >= Number(loyaltySettings.points_for_discount) ? (
                              <label className="flex items-center gap-2 cursor-pointer bg-card p-2 rounded-lg border border-border shadow-sm">
                                <input 
                                  type="checkbox" 
                                  checked={usePoints}
                                  onChange={(e) => setUsePoints(e.target.checked)}
                                  className="w-4 h-4 text-primary rounded border-muted focus:ring-primary"
                                />
                                <span className="text-xs text-foreground font-medium">
                                  Usar {Math.floor(customerPoints / Number(loyaltySettings.points_for_discount)) * Number(loyaltySettings.points_for_discount)} pontos para R$ {(Math.floor(customerPoints / Number(loyaltySettings.points_for_discount)) * Number(loyaltySettings.discount_amount)).toFixed(2)} de desconto!
                                </span>
                              </label>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Você precisa de pelo menos {loyaltySettings.points_for_discount} pts para resgatar.
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Preencha o CPF para ver seus pontos de fidelidade.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Consume type */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Tipo de Consumo</h3>
                <div className="flex gap-2">
                  {(["mesa", "entrega", "retirada"] as ConsumeOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setConsume(opt)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        consume === opt ? "bg-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {consumeLabels[opt]}
                    </button>
                  ))}
                </div>
              </div>

              {consume === "entrega" && (
                <div>
                  <label className="text-sm font-medium text-foreground">Endereço</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro..."
                    className="w-full border border-border rounded-xl p-3 text-sm bg-background text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              )}
              {consume === "mesa" && (
                <div>
                  <label className="text-sm font-medium text-foreground">Número da Mesa</label>
                  <input value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Ex: 5"
                    className="w-full border border-border rounded-xl p-3 text-sm bg-background text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              )}

              <div>
                <h3 className="font-semibold text-foreground mb-2">Forma de Pagamento</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["credito", "debito", "pix", "dinheiro"] as PaymentOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPayment(opt)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        payment === opt ? "bg-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {paymentLabels[opt]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>📌 IMPORTANTE:</strong> Seu pedido só será considerado <strong>VÁLIDO</strong> e passará a ser preparado após você clicar no botão abaixo, enviar a mensagem no WhatsApp e receber a <strong>CONFIRMAÇÃO</strong> do restaurante.
                </p>
              </div>

              <button
                onClick={handleFinalize}
                className="w-full bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-card"
              >
                <MessageCircle size={20} />
                Enviar Pedido via WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && step === "cart" && (
          <div className="border-t border-border p-5 bg-card">
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {addonsTotal > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Adicionais</span><span>R$ {addonsTotal.toFixed(2)}</span>
                </div>
              )}
              {usePoints && loyaltySettings && (
                 <div className="flex justify-between text-sm text-primary font-bold">
                   <span>Desconto Especial (-{Math.floor(customerPoints / Number(loyaltySettings.points_for_discount)) * Number(loyaltySettings.points_for_discount)} pts)</span>
                   <span>- R$ {Math.min(total, Math.floor(customerPoints / Number(loyaltySettings.points_for_discount)) * Number(loyaltySettings.discount_amount)).toFixed(2)}</span>
                 </div>
              )}
              <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t border-border">
                <span>Total</span><span>R$ {Math.max(0, total - (usePoints && loyaltySettings ? Math.floor(customerPoints / Number(loyaltySettings.points_for_discount)) * Number(loyaltySettings.discount_amount) : 0)).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => setStep("checkout")}
              className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-card active:scale-[0.98]"
            >
              Avançar <ChevronRight size={18} />
            </button>
          </div>
        )}

        <div className="text-center py-2 text-[10px] text-muted-foreground border-t border-border">
          Desenvolvido por Gabriel Silva
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
