import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { uploadImage, getContent, updateContent } from "@/services/content";
import { Trash2, GripVertical } from "lucide-react";

import { DndContext, closestCenter } from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

const SortableHeroImage = ({
  img,
  index,
  onDelete,
}: {
  img: string;
  index: number;
  onDelete: (i: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: String(img) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-40 h-24 border rounded overflow-hidden group"
    >
      {/* Preview */}
      <img
        src={img}
        aria-label="preview"
        className="object-cover w-full h-full"
      />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-white/70 p-1 rounded cursor-grab"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(index)}
        aria-label="delete"
        className="absolute top-1 right-1 bg-black/60 p-1 rounded opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="text-white w-4 h-4" />
      </button>
    </div>
  );
};

const HeroSettings = () => {
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [cta, setCTA] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await getContent("hero");
    if (data?.value) {
      setHeading(data.value.heading || "");
      setSubheading(data.value.subheading || "");
      setCTA(data.value.cta || "");
      setImages(data.value.images || []);
    }
    setLoading(false);
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    const { url, error } = await uploadImage("hero", file);
    if (error) {
      alert("Upload failed");
      return;
    }
    setImages((prev) => [...prev, url!]);
  };

  const removeImage = (i: number) => {
    setImages(images.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    const { error } = await updateContent("hero", {
      heading,
      subheading,
      cta,
      images,
    });
    if (error) alert("Save failed");
  };

  if (loading) return <div>Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="font-tenor text-4xl">Hero Section</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">Hero Content</CardTitle>
          <CardDescription className="font-lato">
            Manage hero title, description and carousel
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="font-lato">Heading</Label>
            <Input
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="font-lato"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-lato">Subheading</Label>
            <Input
              value={subheading}
              onChange={(e) => setSubheading(e.target.value)}
              className="font-lato"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-lato">CTA Text</Label>
            <Input
              value={cta}
              onChange={(e) => setCTA(e.target.value)}
              className="font-lato"
            />
          </div>

          {/* IMAGE UPLOAD */}
          <div className="space-y-2">
            <Label className="font-lato">Hero Images (Carousel)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e.target.files?.[0])}
              className="font-lato"
            />

            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (!over) return;

                const activeId = String(active.id);
                const overId = String(over.id);

                if (activeId === overId) return;

                const oldIndex = images.findIndex((img) => img === activeId);
                const newIndex = images.findIndex((img) => img === overId);

                if (oldIndex === -1 || newIndex === -1) return;

                const reordered = [...images];
                const [moved] = reordered.splice(oldIndex, 1);
                reordered.splice(newIndex, 0, moved);

                setImages(reordered);
              }}
            >
              <SortableContext
                items={images}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-wrap mt-4 gap-4">
                  {images.map((img, i) => (
                    <SortableHeroImage
                      key={img}
                      img={img}
                      index={i}
                      onDelete={removeImage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <Button onClick={save} className="font-tenor">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeroSettings;
