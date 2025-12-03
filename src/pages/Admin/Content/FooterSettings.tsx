import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { getContent, updateContent } from "@/services/content";

const FooterSettings = () => {
  const [footer, setFooter] = useState<any>({
    address: "",
    phone: "",
    email: "",
    copyright: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await getContent("footer");
    if (data?.value) {
      setFooter(data.value);
    }
    setLoading(false);
  };

  const save = async () => {
    const { error } = await updateContent("footer", footer);
    if (error) alert("Save failed");
  };

  if (loading) return <div>Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="font-tenor text-4xl">Footer Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-tenor text-2xl">
            Footer Content
          </CardTitle>
          <CardDescription className="font-lato">
            Manage the footer details.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={footer.address}
              onChange={(e) =>
                setFooter({ ...footer, address: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={footer.phone}
                onChange={(e) =>
                  setFooter({ ...footer, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={footer.email}
                onChange={(e) =>
                  setFooter({ ...footer, email: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Copyright Text</Label>
            <Input
              value={footer.copyright}
              onChange={(e) =>
                setFooter({ ...footer, copyright: e.target.value })
              }
            />
          </div>

          <Button onClick={save} className="font-tenor">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FooterSettings;
