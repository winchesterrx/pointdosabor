import { Clock, Bike, ShoppingBag, ShoppingCart, MapPin } from "lucide-react";
import heroBg from "@/assets/hero-sorveteria-bg.png";
import logoImg from "@/assets/logo-pointdosabor.png";
import { useCart } from "@/contexts/CartContext";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchStoreSettings } from "@/data/menuData";

function getIsOpen(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 13 && hour < 22;
}

interface Props {
  onCartOpen?: () => void;
}

export default function HeroHeader({ onCartOpen }: Props) {
  const { data: storeSettings } = useQuery({ queryKey: ["storeSettings"], queryFn: fetchStoreSettings });
  const isOpen = getIsOpen();
  const { itemCount } = useCart();
  return (
    <header className="relative">
      <div className="relative pb-14 pt-8 px-4 overflow-hidden">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a5c6b]/75 via-[#1a5c6b]/55 to-[#1a5c6b]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,92,107,0.2)_0%,rgba(26,92,107,0.5)_100%)]" />

        {/* Desktop Navigation */}
        <div className="hidden lg:flex absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-card/90 backdrop-blur-md px-6 py-3 rounded-full shadow-elevated items-center gap-8">
          <NavLink to="/" className={({isActive}) => `font-semibold text-sm transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground'}`}>Início</NavLink>
          <NavLink to="/pedidos" className={({isActive}) => `font-semibold text-sm transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground'}`}>Pedidos</NavLink>
          <NavLink to="/fidelidade" className={({isActive}) => `font-semibold text-sm transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground'}`}>Fidelidade</NavLink>
          <NavLink to="/admin" className={({isActive}) => `font-semibold text-sm transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground'}`}>Admin</NavLink>
        </div>

        {/* Cart icon - top right */}
        {onCartOpen && (
          <button
            onClick={onCartOpen}
            className="absolute top-4 right-4 lg:right-8 lg:top-6 z-30 bg-card/95 backdrop-blur-md rounded-full p-3 shadow-elevated active:scale-95 transition-all hover:bg-card flex items-center gap-2"
          >
            <ShoppingCart size={22} className="text-primary" />
            <span className="hidden lg:inline font-bold text-sm text-foreground pr-1">Meu Carrinho</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 lg:-top-1.5 lg:-right-1.5 bg-secondary text-white text-[10px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 shadow-sm">
                {itemCount}
              </span>
            )}
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-[50px]" preserveAspectRatio="none">
            <path
              d="M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center mb-4 mt-6 lg:mt-16">
          {/* Logo */}
          <div className="w-48 h-48 lg:w-56 lg:h-56 rounded-full bg-white/95 shadow-[0_8px_32px_rgba(26,92,107,0.35)] overflow-hidden mb-4 transition-transform hover:scale-105 duration-300 p-2 ring-4 ring-white/30">
            <img
              src={logoImg}
              alt="Point do Sabor - Sorveteria e Lanchonete"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
              isOpen
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground"
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-white animate-pulse" : "bg-destructive"}`} />
              {isOpen ? "Aberto Agora" : "Fechado"}
            </span>

            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 text-[#1a5c6b] shadow-sm hover:bg-white transition-colors">
              <Bike size={14} />
              Entrega
            </span>

            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-400/90 text-amber-900 shadow-sm hover:bg-amber-400 transition-colors">
              <ShoppingBag size={14} />
              Retirada
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-white font-medium bg-[#1a5c6b]/70 px-4 py-2 rounded-2xl backdrop-blur-sm text-center">
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span className="text-sm">Seg a Dom • {storeSettings?.opening_time || "13:00"} – {storeSettings?.closing_time || "22:00"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/80">
              <MapPin size={12} />
              <span>Rua Padre Diderico Michels, Álvares Florence - SP</span>
            </div>
            {storeSettings?.delivery_info_text && (
              <span className="text-[11px] text-cyan-200 italic border-t border-white/20 pt-1.5 w-full">
                * {storeSettings.delivery_info_text}
              </span>
            )}
          </div>
        </div>

        {/* Slogan */}
        <div className="relative z-10 text-center mt-2 mb-6 lg:mb-10">
          <p className="text-lg lg:text-2xl font-display font-medium text-white italic leading-relaxed" style={{ textShadow: '0 2px 16px rgba(26,92,107,0.8), 0 1px 4px rgba(0,0,0,0.5)' }}>
            "Variedades em Sorvetes e Açaí" 🍦
          </p>
        </div>
      </div>
    </header>
  );
}
