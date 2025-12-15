import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, Trash2 } from "lucide-react";
  import {
      createProductBasic,
      createProductVariants,
    } from "@/services/products";
  import { useToast } from "@/hooks/use-toast";

const ProductCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Basic product fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [visible, setVisible] = useState(true);
  const [available, setAvailable] = useState(true);

  // Variants
  const [variants, setVariants] = useState([
    { size: "", color: "", stock: 0, visible: true },
  ]);

  // Auto-generate slug
  useEffect(() => {
    const newSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(newSlug);
  }, [name]);

  const addVariant = () => {
    setVariants([
      ...variants,
      { size: "", color: "", stock: 0, visible: true },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, key: string, value: any) => {
    const updated = [...variants];
    updated[index][key] = value;
    setVariants(updated);
  };

  const handleContinue = async () => {
    // Basic validation
    if (!name.trim()) {
      toast({ title: "Product name required", description: "Please add a product name.", duration: 4000 });
      return;
    }
    if (!price || Number(price) <= 0) {
      toast({ title: "Invalid price", description: "Price must be a positive number.", duration: 4000 });
      return;
    }

    // 1. Create product
    const { data: product, error: productError } = await createProductBasic({
      name,
      slug,
      description,
      price: Number(price),
      visible,
      available,
    });

    if (productError || !product) {
      console.error(productError);
      toast({ title: "Failed to create product", description: "Please try again.", duration: 4000 });
      return;
    }

    const productId = product.id;

    // 2. Create variants
    const { error: variantError } = await createProductVariants(
      productId,
      variants
    );

    if (variantError) {
      console.error(variantError);
      toast({ title: "Failed to create variants", description: "Please try again.", duration: 4000 });
      return;
    }

    // 3. Redirect to media manager
    navigate(`/admin/products/${productId}/media`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <h1 className="font-tenor text-4xl text-foreground">Create Product</h1>

      {/* Product Information */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">
            Basic Information
          </CardTitle>
          <CardDescription className="font-lato">
            Enter the core details of the product.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Name + Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-lato">Product Name</Label>
              <Input
                className="font-lato"
                placeholder="e.g., Midnight Black Hoodie"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-lato">Slug</Label>
              <Input
                className="font-lato"
                placeholder="midnight-black-hoodie"
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
              placeholder="Describe the product..."
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
              placeholder="1499"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Visibility and Availability */}
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

      {/* Variants Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">Variants</CardTitle>
          <CardDescription className="font-lato">
            Add sizing and color options for this product.
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
                  placeholder="M / L / XL"
                  value={v.size}
                  onChange={(e) => updateVariant(i, "size", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-lato">Color</Label>
                <Input
                  className="font-lato"
                  placeholder="Black"
                  value={v.color}
                  onChange={(e) => updateVariant(i, "color", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-lato">Stock</Label>
                <Input
                  type="number"
                  className="font-lato"
                  placeholder="10"
                  value={v.stock}
                  onChange={(e) =>
                    updateVariant(i, "stock", Number(e.target.value))
                  }
                />
              </div>

              <div className="flex items-center gap-3">
                <Label className="font-lato">Visible</Label>
                <Switch
                  checked={v.visible}
                  onCheckedChange={(val) => updateVariant(i, "visible", val)}
                />
              </div>

              {/* Remove button */}
              {variants.length > 1 && (
                <Button
                  variant="outline"
                  className="mt-3 md:col-span-4 text-destructive font-lato"
                  onClick={() => removeVariant(i)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Variant
                </Button>
              )}
            </div>
          ))}

          <Button variant="outline" className="font-lato" onClick={addVariant}>
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button size="lg" className="font-tenor px-8" onClick={handleContinue}>
          Continue to Images →
        </Button>
      </div>
    </div>
  );
};

export default ProductCreate;
