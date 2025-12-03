import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Loader2, Plus } from "lucide-react";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { uploadImage, getContent, updateContent } from "@/services/content";


// -----------------------------
// Sortable Image Component for portrait_grid
// -----------------------------
const SortablePortraitImage = ({
  img,
  index,
  onDelete,
  onReplace,
}: {
  img: string;
  index: number;
  onDelete: (i: number) => void;
  onReplace: (i: number, file: File) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: img });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-32 h-48 border rounded overflow-hidden group"
    >
      <img src={img} aria-label="img" className="object-cover w-full h-full" />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-white/70 p-1 rounded cursor-grab"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(index)}
        aria-label="delete"
        className="absolute top-2 right-2 bg-black/60 p-1 rounded opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="text-white w-4 h-4" />
      </button>

      {/* Replace */}
      <label className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/80 px-2 py-0.5 text-xs rounded cursor-pointer opacity-0 group-hover:opacity-100">
        Replace
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onReplace(index, e.target.files[0]);
          }}
        />
      </label>
    </div>
  );
};


// -----------------------------
// MAIN PAGE
// -----------------------------
const GallerySettings = () => {
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");

  const [heroTop, setHeroTop] = useState("");
  const [heroBottom, setHeroBottom] = useState("");

  const [portraitLeft, setPortraitLeft] = useState({
    title: "",
    caption: "",
    image: "",
  });

  const [portraitRight, setPortraitRight] = useState({
    title: "",
    caption: "",
    image: "",
  });

  const [portraitGrid, setPortraitGrid] = useState<string[]>([]);


  // -----------------------------
  // LOAD FROM SUPABASE
  // -----------------------------
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await getContent("gallery");

    if (data?.value) {
      const g = data.value;

      setTitle(g.title || "");

      setHeroTop(g.hero_block_top?.image || "");
      setHeroBottom(g.hero_block_bottom?.image || "");

      setPortraitLeft({
        title: g.portrait_left?.title || "",
        caption: g.portrait_left?.caption || "",
        image: g.portrait_left?.image || "",
      });

      setPortraitRight({
        title: g.portrait_right?.title || "",
        caption: g.portrait_right?.caption || "",
        image: g.portrait_right?.image || "",
      });

      setPortraitGrid(g.portrait_grid?.map((p: any) => p.image) || []);
    }

    setLoading(false);
  };


  // -----------------------------
  // UPLOAD HANDLERS
  // -----------------------------
  const uploadAndSet = async (file: File, setter: (url: string) => void) => {
    const { url, error } = await uploadImage("gallery", file);
    if (error) { alert("Upload failed"); return; }
    setter(url!);
  };

  const addPortraitGridImage = async (file: File) => {
    const { url, error } = await uploadImage("gallery", file);
    if (error) { alert("Upload failed"); return; }
    setPortraitGrid([...portraitGrid, url!]);
  };

  const replacePortraitGridImage = async (index: number, file: File) => {
    const { url, error } = await uploadImage("gallery", file);
    if (error) { alert("Upload failed"); return; }

    const updated = [...portraitGrid];
    updated[index] = url!;
    setPortraitGrid(updated);
  };


  // -----------------------------
  // SAVE TO SUPABASE
  // -----------------------------
  const save = async () => {
    const payload = {
      title,
      hero_block_top: { image: heroTop },
      portrait_left: {
        title: portraitLeft.title,
        caption: portraitLeft.caption,
        image: portraitLeft.image,
      },
      portrait_grid: portraitGrid.map((url) => ({ image: url })),
      portrait_right: {
        title: portraitRight.title,
        caption: portraitRight.caption,
        image: portraitRight.image,
      },
      hero_block_bottom: { image: heroBottom },
    };

    const { error } = await updateContent("gallery", payload);

    if (error) alert("Save failed!");
    else alert("Gallery updated!");
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground gap-3">
        <Loader2 className="animate-spin w-6 h-6" />
        Loading gallery…
      </div>
    );
  }


  // -----------------------------
  // RENDER UI
  // -----------------------------
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <h1 className="font-tenor text-4xl">Gallery Section</h1>


      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">Gallery Title</CardTitle>
          <CardDescription className="font-lato">Shown above the gallery layout</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-lato"
          />
        </CardContent>
      </Card>


      {/* Hero Block Top */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">Hero Block (Top)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="font-lato">Upload 16:9 Image</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files && uploadAndSet(e.target.files[0], setHeroTop)
            }
          />

          {heroTop && (
            <img src={heroTop} aria-label="herotop" className="rounded w-full max-w-lg" />
          )}
        </CardContent>
      </Card>


      {/* Portrait Left Block */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">Portrait Left Block</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="font-lato">Title</Label>
          <Input
            value={portraitLeft.title}
            onChange={(e) =>
              setPortraitLeft({ ...portraitLeft, title: e.target.value })
            }
          />

          <Label className="font-lato">Caption</Label>
          <Textarea
            value={portraitLeft.caption}
            onChange={(e) =>
              setPortraitLeft({ ...portraitLeft, caption: e.target.value })
            }
          />

          <Label className="font-lato">Upload 4:5 Image</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files &&
              uploadAndSet(e.target.files[0], (url) =>
                setPortraitLeft({ ...portraitLeft, image: url })
              )
            }
          />

          {portraitLeft.image && (
            <img src={portraitLeft.image} aria-label="portraitleft" className="rounded w-40" />
          )}
        </CardContent>
      </Card>


      {/* Portrait Grid Block */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">
            Portrait Grid (3+ Vertical Images)
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Label className="font-lato">Upload Portrait (9:16)</Label>

          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files && addPortraitGridImage(e.target.files[0])
            }
          />

          {/* Drag and drop grid */}
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (!over) return;

              const activeId = String(active.id);
              const overId = String(over.id);

              const oldIndex = portraitGrid.indexOf(activeId);
              const newIndex = portraitGrid.indexOf(overId);

              if (oldIndex === -1 || newIndex === -1) return;

              const reordered = [...portraitGrid];
              const [moved] = reordered.splice(oldIndex, 1);
              reordered.splice(newIndex, 0, moved);

              setPortraitGrid(reordered);
            }}
          >
            <SortableContext
              items={portraitGrid}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex gap-4 flex-wrap mt-4">
                {portraitGrid.map((img, i) => (
                  <SortablePortraitImage
                    key={img}
                    img={img}
                    index={i}
                    onDelete={(i) =>
                      setPortraitGrid(portraitGrid.filter((_, idx) => idx !== i))
                    }
                    onReplace={replacePortraitGridImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>


      {/* Portrait Right */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">Portrait Right Block</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Label className="font-lato">Title</Label>
          <Input
            value={portraitRight.title}
            onChange={(e) =>
              setPortraitRight({ ...portraitRight, title: e.target.value })
            }
          />

          <Label className="font-lato">Caption</Label>
          <Textarea
            value={portraitRight.caption}
            onChange={(e) =>
              setPortraitRight({ ...portraitRight, caption: e.target.value })
            }
          />

          <Label>Upload 4:5 Image</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files &&
              uploadAndSet(e.target.files[0], (url) =>
                setPortraitRight({ ...portraitRight, image: url })
              )
            }
          />

          {portraitRight.image && (
            <img src={portraitRight.image} aria-label="portraitright" className="w-40 rounded" />
          )}
        </CardContent>
      </Card>


      {/* Hero Block Bottom */}
      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">Hero Block (Bottom)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label>Upload 16:9 Image</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files && uploadAndSet(e.target.files[0], setHeroBottom)
            }
          />

          {heroBottom && (
            <img src={heroBottom} aria-label="herobottom" className="rounded w-full max-w-lg" />
          )}
        </CardContent>
      </Card>


      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={save} className="font-tenor px-8 py-6 text-lg">
          Save Gallery
        </Button>
      </div>
    </div>
  );
};

export default GallerySettings;
