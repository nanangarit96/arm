import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Star, ShoppingCart, Sparkles, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Product } from "@shared/schema";

const categories = ["Semua", "Elektronik", "Fashion", "Kesehatan", "Makanan"];

export default function CustomerMall() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/active"],
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredProducts = (products || []).filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mall Online</h1>
        <p className="text-muted-foreground text-sm">Temukan produk terbaik dengan komisi menarik</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-products"
        />
      </div>

      <Button variant="outline" className="w-full justify-center gap-2" data-testid="button-filter">
        <SlidersHorizontal className="h-4 w-4" />
        Filter
      </Button>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setSelectedCategory(cat)}
            data-testid={`filter-category-${cat.toLowerCase()}`}
          >
            {cat}
          </Badge>
        ))}
      </div>

      <Card className="p-4 flex items-center gap-3 bg-accent/50">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-medium">Produk Populer Minggu Ini</h3>
          <p className="text-sm text-muted-foreground">Dapatkan komisi hingga 15%</p>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="text-muted-foreground">Memuat produk...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} formatPrice={formatPrice} />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              Tidak ada produk ditemukan
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, formatPrice }: { product: Product; formatPrice: (price: number) => string }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <Card className="overflow-hidden" data-testid={`product-card-${product.id}`}>
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Image className="h-12 w-12 text-muted-foreground/30" />
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{(product.rating / 10).toFixed(1)}</span>
          <span>({product.reviews})</span>
        </div>
        <p className="text-primary font-bold text-sm mb-2" data-testid={`text-product-price-${product.id}`}>{formatPrice(product.price)}</p>
        <Button size="sm" className="w-full" data-testid={`button-view-product-${product.id}`}>
          <ShoppingCart className="h-4 w-4 mr-1" />
          Lihat
        </Button>
      </div>
    </Card>
  );
}
