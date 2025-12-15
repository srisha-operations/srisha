import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { uploadImage, getContent, updateContent } from "@/services/content";
import { useToast } from "@/hooks/use-toast";

const BrandSettings = () => {
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await getContent("brand");
    if (data?.value) {
      setBrandName(data.value.name || "");
      setBrandLogo(data.value.logo || "");
    }
    setLoading(false);
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    const { url, error } = await uploadImage("brand", file);
    if (error) {
      toast({ title: "Upload failed", description: "Logo upload failed.", duration: 4000 });
      return;
    }
    setBrandLogo(url!);
  };

  const save = async () => {
    const { error } = await updateContent("brand", {
      name: brandName,
      logo: brandLogo,
    });
    if (error) toast({ title: "Save failed", description: "Could not save brand content.", duration: 4000 });
    else toast({ title: "Saved", description: "Brand content saved successfully.", duration: 3000 });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="font-tenor text-4xl">Brand Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">Brand Details</CardTitle>
          <CardDescription className="font-lato">Update your brand info.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="font-lato">Brand Name</Label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="font-lato"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-lato">Brand Logo (PNG/SVG)</Label>
            <Input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
            {brandLogo && (
              <div className="w-32 mt-4">
                <img src={brandLogo} alt="logo" className="rounded" />
              </div>
            )}
          </div>

          <Button onClick={save} className="font-tenor w-full md:w-auto">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandSettings;
