import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { listProducts, deleteProductById, toggleProductVisibility } from "@/services/products";
import { Trash2, Edit, ImageIcon } from "lucide-react";

const ProductsList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await listProducts();
    if (error) {
      console.error(error);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this product? This will remove images from storage and DB.")) return;
    setDeletingId(id);
    const { error } = await deleteProductById(id);
    setDeletingId(null);
    if (error) {
      alert("Failed to delete product.");
      console.error(error);
      return;
    }
    // refresh
    await load();
  };

  const onToggleVisibility = async (id: string, current: boolean) => {
    const { error } = await toggleProductVisibility(id, !current);
    if (error) {
      alert("Failed to update visibility.");
      console.error(error);
      return;
    }
    // optimistic update locally
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, visible: !current } : p)));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-tenor text-3xl">Products</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/products/new")}>Add Product</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-muted-foreground">No products yet.</div>
      ) : (
        <div className="grid gap-4">
          {products.map((p) => {
            const thumb = p.product_images?.find((i:any) => !i.is_hover)?.url || p.product_images?.[0]?.url || "/assets/placeholder.png";
            return (
              <Card key={p.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4 items-start">
                    <img src={thumb} alt={p.name} className="w-28 h-36 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="font-tenor text-xl">{p.name}</h3>
                      <p className="font-lato text-muted-foreground">₹{p.price}</p>
                      <div className="mt-3 flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Visible</Label>
                          <Switch
                            checked={p.visible !== false}
                            onCheckedChange={() => onToggleVisibility(p.id, p.visible !== false)}
                          />
                        </div>
                        <div className="text-sm font-lato text-muted-foreground">
                          Variants: {p.product_variants?.length || 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/products/${p.id}/edit`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>

                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/products/${p.id}/media`)}>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Media
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(p.id)}
                        disabled={deletingId === p.id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deletingId === p.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductsList;
