import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, fetchProducts } from "@/data/menuData";
import type { Product } from "@/data/menuData";
import HeroHeader from "@/components/menu/HeroHeader";
import PromoCarousel from "@/components/menu/PromoCarousel";
import CategoryNav from "@/components/menu/CategoryNav";
import PopularSection from "@/components/menu/PopularSection";
import ProductCard from "@/components/menu/ProductCard";
import ProductModal from "@/components/menu/ProductModal";
import FloatingCart from "@/components/menu/FloatingCart";
import CheckoutModal from "@/components/menu/CheckoutModal";
import BottomNav from "@/components/menu/BottomNav";
import WhatsAppButton from "@/components/menu/WhatsAppButton";
import SubCategoryNav from "@/components/menu/SubCategoryNav";
import { fetchCategories } from "@/data/menuData";

const Index = () => {
  const { data: rawProducts = [] } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const products = rawProducts.filter((p: Product) => !p.manage_stock || (p.stock_quantity !== undefined && p.stock_quantity > 0));
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const [activeCategory, setActiveCategory] = useState("todos"); // Only used for visual highlight in top nav
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeSubCategories, setActiveSubCategories] = useState<Record<string, string>>({});

  const handleSubCategorySelect = (categoryId: string, subCategory: string) => {
    setActiveSubCategories(prev => ({ ...prev, [categoryId]: subCategory }));
  };

  return (
    <div className="min-h-screen bg-background pb-[150px] lg:pb-0 w-full overflow-x-hidden">
      <HeroHeader onCartOpen={() => setShowCheckout(true)} />
      
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        <PromoCarousel products={products} onSelect={setSelectedProduct} />
        <PopularSection products={products} onSelect={setSelectedProduct} />

        <CategoryNav active={activeCategory} onSelect={setActiveCategory} />

        <div className="px-3 sm:px-0 mt-4 md:mt-8">
          
          {categories.map((category) => {
            const categoryProducts = products.filter(p => p.category === category.id);
            if (categoryProducts.length === 0) return null;

            // Extract unique subcategories
            const subCategoriesSet = new Set(
              categoryProducts
                .map(p => p.subCategory)
                .filter(sub => sub && sub.trim() !== "")
            );
            const subCategories = Array.from(subCategoriesSet) as string[];
            
            const activeSub = activeSubCategories[category.id] || "todos";
            const displayedProducts = activeSub === "todos" 
              ? categoryProducts 
              : categoryProducts.filter(p => p.subCategory === activeSub);

            return (
              <div key={category.id} id={`category-${category.id}`} className="mb-10 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground relative z-10 inline-block">
                    {category.name}
                    <div className="absolute -bottom-1 left-0 right-0 h-2 bg-primary/20 rounded-full -z-10" />
                  </h2>
                </div>
                
                {/* Internal Filter Pills for this Section */}
                <SubCategoryNav 
                  subCategories={subCategories} 
                  active={activeSub} 
                  onSelect={(sub) => handleSubCategorySelect(category.id, sub)} 
                />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                  {displayedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onSelect={setSelectedProduct} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <FloatingCart onOpen={() => setShowCheckout(true)} />
      <CheckoutModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} />
      <WhatsAppButton />
      <BottomNav />
    </div>
  );
};

export default Index;
