import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProductById,
  updateProductBasic,
  replaceProductVariants,
  addVariant,
  updateVariant,
  deleteVariant,
} from "@/services/products";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";

const ProductEdit = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [visible, setVisible] = useState(true);
  const [available, setAvailable] = useState(true);

  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    const { data, error } = await getProductById(productId!);

    if (error || !data) {
      toast({ title: "Failed to load product", description: "Please try again.", duration: 4000 });
      return;
    }

    setName(data.name);
    setSlug(data.slug);
    setDescription(data.description || "");
    setPrice(String(data.price));
    setVisible(data.visible);
    setAvailable(data.available);
    setVariants(
      data.product_variants?.map((v: any) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
        visible: v.visible,
      })) || []
    );

    setLoading(false);
  };

  const handleAddVariantLocal = () => {
    setVariants([
      ...variants,
      { size: "", color: "", stock: 0, visible: true },
    ]);
  };

  const handleRemoveVariantLocal = (i: number) => {
    setVariants(variants.filter((_, idx) => idx !== i));
  };

  const handleUpdateVariantLocal = (i: number, key: string, value: any) => {
    const updated = [...variants];
    updated[i][key] = value;
    setVariants(updated);
  };

  const syncVariantsToSupabase = async () => {
    const existingIds = variants.filter((v) => v.id).map((v) => v.id);

    // load original variants from DB
    const { data: original } = await getProductById(productId!);
    const originalIds = original.product_variants.map((v: any) => v.id);

    // 1. Deleted variants
    for (const id of originalIds) {
      if (!existingIds.includes(id)) {
        await deleteVariant(id);
      }
    }

    // 2. Updated or new variants
    for (const v of variants) {
      if (v.id) {
        // update
        await updateVariant(v.id, {
          size: v.size,
          color: v.color,
          stock: v.stock,
          visible: v.visible,
        });
      } else {
        // add new
        await addVariant(productId!, {
          size: v.size,
          color: v.color,
          stock: v.stock,
          visible: v.visible,
        });
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Product name is required", description: "Please add a product name.", duration: 4000 });
      return;
    }
    if (!price || Number(price) <= 0) {
      toast({ title: "Price invalid", description: "Please enter a valid price.", duration: 4000 });
      return;
    }

    // 1. Update basic product data
    const { error: updateError } = await updateProductBasic(productId!, {
      name,
      slug,
      description,
      price: Number(price),
      visible,
      available,
    });

    if (updateError) {
      toast({ title: "Failed to update product", description: "Please try again.", duration: 4000 });
      console.error(updateError);
      return;
    }

    // 2. Sync variants
    await syncVariantsToSupabase();

    navigate("/admin/products");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground gap-3">
        <Loader2 className="animate-spin w-6 h-6" />
        Loading product...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <h1 className="font-tenor text-4xl">Edit Product</h1>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">
            Basic Information
          </CardTitle>
          <CardDescription className="font-lato">
            Modify product details.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-lato">Product Name</Label>
              <Input
                className="font-lato"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-lato">Slug</Label>
              <Input
                className="font-lato"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="font-lato">Description</Label>
            <Textarea
              className="font-lato"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label className="font-lato">Base Price (₹)</Label>
            <Input
              type="number"
              className="font-lato"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Visibility */}
          <div className="flex gap-10">
            <div className="flex items-center gap-3">
              <Label className="font-lato">Visible</Label>
              <Switch checked={visible} onCheckedChange={setVisible} />
            </div>

            <div className="flex items-center gap-3">
              <Label className="font-lato">Available</Label>
              <Switch checked={available} onCheckedChange={setAvailable} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">Variants</CardTitle>
          <CardDescription className="font-lato">
            Edit sizing and stock details.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {variants.map((v, i) => (
            <div
              key={i}
              className="border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div className="space-y-2">
                <Label className="font-lato">Size</Label>
                <Input
                  className="font-lato"
                  value={v.size}
                  onChange={(e) => handleUpdateVariantLocal(i, "size", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-lato">Color</Label>
                <Input
                  className="font-lato"
                  value={v.color}
                  onChange={(e) => handleUpdateVariantLocal(i, "color", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-lato">Stock</Label>
                <Input
                  type="number"
                  className="font-lato"
                  value={v.stock}
                  onChange={(e) =>
                    handleUpdateVariantLocal(i, "stock", Number(e.target.value))
                  }
                />
              </div>

              <div className="flex items-center gap-3">
                <Label className="font-lato">Visible</Label>
                <Switch
                  checked={v.visible}
                  onCheckedChange={(val) => handleUpdateVariantLocal(i, "visible", val)}
                />
              </div>

              {variants.length > 1 && (
                <Button
                  variant="outline"
                  className="mt-3 md:col-span-4 text-destructive font-lato"
                  onClick={() => handleRemoveVariantLocal(i)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Variant
                </Button>
              )}
            </div>
          ))}

          <Button variant="outline" className="font-lato" onClick={handleAddVariantLocal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button size="lg" className="font-tenor px-8" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ProductEdit;
