import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import {
  getProductImages,
  uploadProductImageFile,
  addProductImageRecord,
  saveImageOrder,
  setHoverImage,
  deleteProductImage,
} from "@/services/products";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Star, Trash2, GripVertical } from "lucide-react";



const SortableImage = ({ img }: { img: any }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group border rounded overflow-hidden p-1"
    >
      {/* Preview */}
      <img src={img.url} aria-label="preview" className="w-full h-40 object-cover rounded" />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-white/70 rounded p-1 cursor-grab"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Hover star */}
      <button
        onClick={() => img._hover(img)}
        aria-label="hoverstar"
        className={`absolute top-2 right-2 p-1 rounded ${
          img.is_hover
            ? "bg-yellow-400 text-black"
            : "bg-white/70 text-muted-foreground"
        }`}
      >
        <Star className="w-4 h-4" />
      </button>

      {/* Delete */}
      <button
        onClick={() => img._delete(img)}
        className="absolute bottom-2 right-2 bg-white/70 text-red-600 p-1 rounded opacity-0 group-hover:opacity-100"
        aria-label="delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const ProductMedia = () => {
  const { id: productId } = useParams();
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    const { data } = await getProductImages(productId!);
    setImages(data || []);
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);

    // 1. Upload to storage
    const { data: publicUrl, error: uploadError } =
      await uploadProductImageFile(file, productId!);

    if (uploadError) {
      toast({ title: "Upload failed", description: "Failed to upload image.", duration: 4000 });
      setUploading(false);
      return;
    }

    // 2. Insert DB record
    await addProductImageRecord({
      productId: productId!,
      url: publicUrl!,
      position: images.length,
      is_hover: images.length === 0, // first image auto hover
    });

    setUploading(false);
    loadImages();
  };

  const handleDelete = async (img: any) => {
    await deleteProductImage(img.url, img.id);
    loadImages();
  };

  const handleHoverSelect = async (img: any) => {
    await setHoverImage(productId!, img.id);
    loadImages();
  };

  const handleDrag = (result: any) => {
    if (!result.destination) return;

    const reordered = Array.from(images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setImages(reordered);
  };

  const saveOrder = async () => {
    await saveImageOrder(productId!, images);
    toast({ title: "Order saved", description: "Image order saved successfully.", duration: 3000 });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <h1 className="font-tenor text-4xl">Product Media</h1>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor">Upload Images</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <Label className="font-lato">Upload JPEG/PNG files</Label>

          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files?.[0])}
            disabled={uploading}
          />

          {uploading && (
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <Loader2 className="animate-spin w-5 h-5" />
              Uploading...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor">Images</CardTitle>
        </CardHeader>

        <CardContent>
          {images.length === 0 ? (
            <p className="font-lato text-muted-foreground">
              No images uploaded yet.
            </p>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={async (event) => {
                const { active, over } = event;
                if (!over || active.id === over.id) return;

                const oldIndex = images.findIndex((i) => i.id === active.id);
                const newIndex = images.findIndex((i) => i.id === over.id);

                const reordered = [...images];
                const [moved] = reordered.splice(oldIndex, 1);
                reordered.splice(newIndex, 0, moved);

                setImages(reordered);
              }}
            >
              <SortableContext
                items={images.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img) => (
                    <SortableImage
                      key={img.id}
                      img={{
                        ...img,
                        _hover: handleHoverSelect,
                        _delete: handleDelete,
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {images.length > 1 && (
            <div className="flex justify-end mt-6">
              <Button onClick={saveOrder} className="font-tenor">
                Save Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductMedia;
