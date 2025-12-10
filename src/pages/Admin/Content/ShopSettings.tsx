import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabaseClient";

const ShopSettings = () => {
  const [mode, setMode] = useState<"normal" | "preorder">("normal");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "shop_settings")
        .single();

      if (data?.value?.mode) {
        setMode(data.value.mode === "preorder" ? "preorder" : "normal");
      }
    } catch (e) {
      console.error("Load shop settings error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("site_content")
        .upsert({
          key: "shop_settings",
          value: { mode },
        })
        .eq("key", "shop_settings");

      if (error) {
        console.error("Save error:", error);
        alert("Failed to save settings");
        return;
      }

      alert("Shop settings updated successfully!");
      
      // Broadcast to all clients
      window.dispatchEvent(new CustomEvent("shopModeChanged", { detail: { mode } }));
    } catch (e) {
      console.error("Save error:", e);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-tenor text-2xl">Shop Settings</CardTitle>
        <CardDescription>Configure shop mode and order type</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-tenor mb-4 block">Shop Mode</Label>
          <RadioGroup value={mode} onValueChange={(val) => setMode(val as "normal" | "preorder")}>
            <div className="flex items-center space-x-2 mb-4 p-4 border border-border rounded hover:bg-muted cursor-pointer">
              <RadioGroupItem value="normal" id="mode-normal" />
              <Label htmlFor="mode-normal" className="font-lato cursor-pointer flex-1">
                <div className="font-tenor text-base">Normal Order Mode</div>
                <p className="text-sm text-muted-foreground font-lato">
                  Customers can add products to cart and checkout with payment.
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 mb-4 p-4 border border-border rounded hover:bg-muted cursor-pointer">
              <RadioGroupItem value="preorder" id="mode-preorder" />
              <Label htmlFor="mode-preorder" className="font-lato cursor-pointer flex-1">
                <div className="font-tenor text-base">Pre-Order Mode</div>
                <p className="text-sm text-muted-foreground font-lato">
                  Customers submit pre-order requests. Admin reviews and contacts them for approval.
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="font-lato text-sm">
            <strong>Current Mode:</strong> <span className="font-tenor">{mode === "normal" ? "Normal Order" : "Pre-Order"}</span>
          </p>
          <p className="font-lato text-xs text-muted-foreground mt-2">
            This setting affects how customers checkout. Changes take effect immediately across the site.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
          <Button
            onClick={load}
            variant="outline"
            disabled={isSaving}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopSettings;
