import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Download, Upload, Package, Settings, FileText, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import contentData from "@/data/content.json";
import productsData from "@/data/products.json";

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  
  // Content Management State
  const [brandName, setBrandName] = useState("SRISHA");
  const [brandLogo, setBrandLogo] = useState("");
  const [heroHeading, setHeroHeading] = useState("Vision Statement");
  const [heroSubheading, setHeroSubheading] = useState("Description");
  const [heroCTA, setHeroCTA] = useState("DISCOVER");
  const [aboutText, setAboutText] = useState("");
  
  // Footer State
  const [footerAddress, setFooterAddress] = useState("");
  const [footerPhone, setFooterPhone] = useState("");
  const [footerEmail, setFooterEmail] = useState("");
  const [footerCopyright, setFooterCopyright] = useState("");
  
  // Product Management State
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Inquiry State
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);

  useEffect(() => {
    const adminAuth = localStorage.getItem("srisha_admin");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
      loadAdminData();
    }
  }, []);

  const loadAdminData = () => {
    // Load content
    const content = localStorage.getItem("admin_content");
    if (content) {
      const data = JSON.parse(content);
      setBrandName(data.brand?.name || "SRISHA");
      setBrandLogo(data.brand?.logo || "");
      setHeroHeading(data.hero?.heading || "Vision Statement");
      setHeroSubheading(data.hero?.subheading || "Description");
      setHeroCTA(data.hero?.cta || "DISCOVER");
      setAboutText(data.about?.body || "");
      setFooterAddress(data.footer?.address || "");
      setFooterPhone(data.footer?.phone || "");
      setFooterEmail(data.footer?.email || "");
      setFooterCopyright(data.footer?.copyright || "");
    } else {
      // Load defaults from content.json
      setBrandName(contentData.brand?.name || "SRISHA");
      setBrandLogo(contentData.brand?.logo || "");
      setHeroHeading(contentData.hero?.heading || "Vision Statement");
      setHeroSubheading(contentData.hero?.subheading || "Description");
      setHeroCTA(contentData.hero?.cta || "DISCOVER");
      setAboutText(contentData.about?.body || "");
    }

    // Load products
    const productsLocal = localStorage.getItem("admin_products");
    if (productsLocal) {
      setProducts(JSON.parse(productsLocal));
    } else {
      setProducts(productsData.products);
    }

    // Load inquiries
    const inquiriesData = localStorage.getItem("admin_inquiries");
    if (inquiriesData) {
      setInquiries(JSON.parse(inquiriesData));
    }
  };

  const handleLogin = () => {
    if (username === "admin" && password === "admin123") {
      localStorage.setItem("srisha_admin", "true");
      setIsAuthenticated(true);
      loadAdminData();
    } else {
      alert("Invalid credentials. Use: admin / admin123");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("srisha_admin");
    setIsAuthenticated(false);
    navigate("/");
  };

  const confirmAndSaveContent = () => {
    setConfirmAction(() => () => {
      const contentSaveData = {
        brand: { name: brandName, logo: brandLogo },
        hero: { heading: heroHeading, subheading: heroSubheading, cta: heroCTA },
        about: { body: aboutText },
        footer: { address: footerAddress, phone: footerPhone, email: footerEmail, copyright: footerCopyright },
        gallery: contentData.gallery,
      };
      localStorage.setItem("admin_content", JSON.stringify(contentSaveData));
      alert("Content saved! Refresh the homepage to see changes.");
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  const confirmAndSaveProducts = () => {
    setConfirmAction(() => () => {
      localStorage.setItem("admin_products", JSON.stringify(products));
      alert("Products saved!");
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  const addProduct = () => {
    const newProduct = {
      id: `p${Date.now()}`,
      name: "New Product",
      price: "₹50,000",
      aspectRatio: "4:5",
      thumbDefault: "/assets/45demo1.png",
      thumbHover: "/assets/45demo2.png",
      wishlist: false,
      order: products.length + 1,
      visible: true,
      description: "Product description goes here",
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Default"],
      stock: 10,
      images: ["/assets/45demo1.png", "/assets/45demo2.png"],
    };
    setProducts([...products, newProduct]);
    setEditingProduct(newProduct);
  };

  const updateProduct = (updatedProduct: any) => {
    setProducts(products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const updateInquiryStatus = (inquiryId: string, newStatus: string) => {
    const updated = inquiries.map((inq) =>
      inq.id === inquiryId ? { ...inq, status: newStatus } : inq
    );
    setInquiries(updated);
    localStorage.setItem("admin_inquiries", JSON.stringify(updated));
  };

  const exportData = () => {
    const data = {
      content: JSON.parse(localStorage.getItem("admin_content") || "{}"),
      products: products,
      inquiries: inquiries,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `srisha-admin-export-${Date.now()}.json`;
    a.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-accent/10">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="font-tenor text-3xl text-center">Admin Panel</CardTitle>
            <CardDescription className="text-center font-lato">
              Enter your credentials to access dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-lato">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="font-lato"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-lato">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                className="font-lato"
              />
            </div>
            <Button onClick={handleLogin} className="w-full font-tenor">
              Sign In
            </Button>
            <p className="text-xs text-muted-foreground text-center font-lato">
              Demo credentials: <b>admin</b> / <b>admin123</b>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="border-b border-border bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="font-tenor text-3xl text-foreground">SRISHA Admin</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportData} className="font-lato">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="font-lato">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto py-8 px-4 lg:px-8">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="content" className="font-tenor gap-2">
              <FileText className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="products" className="font-tenor gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="footer" className="font-tenor gap-2">
              <Settings className="w-4 h-4" />
              Footer
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="font-tenor gap-2">
              <Users className="w-4 h-4" />
              Inquiries
            </TabsTrigger>
          </TabsList>

          {/* CONTENT MANAGEMENT TAB */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-tenor">Brand Settings</CardTitle>
                <CardDescription className="font-lato">Manage your brand identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-lato">Brand Name</Label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="font-lato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-lato">Logo URL (PNG/SVG)</Label>
                    <Input
                      value={brandLogo}
                      onChange={(e) => setBrandLogo(e.target.value)}
                      placeholder="/logo.svg"
                      className="font-lato"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-tenor">Hero Section</CardTitle>
                <CardDescription className="font-lato">Edit homepage hero content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-lato">Vision Statement</Label>
                  <Input
                    value={heroHeading}
                    onChange={(e) => setHeroHeading(e.target.value)}
                    className="font-lato"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-lato">Description</Label>
                  <Input
                    value={heroSubheading}
                    onChange={(e) => setHeroSubheading(e.target.value)}
                    className="font-lato"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-lato">CTA Button Text</Label>
                  <Input
                    value={heroCTA}
                    onChange={(e) => setHeroCTA(e.target.value)}
                    className="font-lato"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-tenor">About Section</CardTitle>
                <CardDescription className="font-lato">Edit about text</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  rows={4}
                  className="font-lato"
                  placeholder="Enter about section text..."
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={confirmAndSaveContent} size="lg" className="font-tenor">
                Save Content Changes
              </Button>
            </div>
          </TabsContent>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-tenor text-2xl">Product Management</h2>
              <Button onClick={addProduct} className="font-tenor">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4 items-start">
                      <img
                        src={product.thumbDefault}
                        alt={product.name}
                        className="w-24 h-32 object-cover"
                        loading="lazy"
                      />
                      <div className="flex-1 space-y-2">
                        <h3 className="font-tenor text-xl">{product.name}</h3>
                        <p className="font-lato text-muted-foreground">{product.price}</p>
                        <div className="flex gap-2 items-center">
                          <span className="text-sm font-lato">Visible:</span>
                          <Switch
                            checked={product.visible !== false}
                            onCheckedChange={(checked) => {
                              const updated = products.map((p) =>
                                p.id === product.id ? { ...p, visible: checked } : p
                              );
                              setProducts(updated);
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                          className="font-lato"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                          className="text-destructive font-lato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={confirmAndSaveProducts} size="lg" className="font-tenor">
                Save Products
              </Button>
            </div>
          </TabsContent>

          {/* FOOTER TAB */}
          <TabsContent value="footer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-tenor">Footer Settings</CardTitle>
                <CardDescription className="font-lato">Manage footer contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-lato">Address</Label>
                  <Textarea
                    value={footerAddress}
                    onChange={(e) => setFooterAddress(e.target.value)}
                    rows={2}
                    className="font-lato"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-lato">Phone</Label>
                    <Input
                      value={footerPhone}
                      onChange={(e) => setFooterPhone(e.target.value)}
                      className="font-lato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-lato">Email</Label>
                    <Input
                      value={footerEmail}
                      onChange={(e) => setFooterEmail(e.target.value)}
                      className="font-lato"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-lato">Copyright Text</Label>
                  <Input
                    value={footerCopyright}
                    onChange={(e) => setFooterCopyright(e.target.value)}
                    className="font-lato"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={confirmAndSaveContent} size="lg" className="font-tenor">
                Save Footer Settings
              </Button>
            </div>
          </TabsContent>

          {/* INQUIRIES TAB */}
          <TabsContent value="inquiries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-tenor">Customer Inquiries</CardTitle>
                <CardDescription className="font-lato">
                  {inquiries.length} total inquiries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inquiries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 font-lato">
                    No inquiries yet
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-tenor">Customer</TableHead>
                        <TableHead className="font-tenor">Contact</TableHead>
                        <TableHead className="font-tenor">Date</TableHead>
                        <TableHead className="font-tenor">Items</TableHead>
                        <TableHead className="font-tenor">Status</TableHead>
                        <TableHead className="font-tenor">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inquiries.map((inquiry) => (
                        <TableRow key={inquiry.id}>
                          <TableCell className="font-lato">{inquiry.customerName}</TableCell>
                          <TableCell className="font-lato text-sm">{inquiry.contact}</TableCell>
                          <TableCell className="font-lato text-sm">
                            {new Date(inquiry.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-lato">{inquiry.items?.length || 1}</TableCell>
                          <TableCell>
                            <Select
                              value={inquiry.status}
                              onValueChange={(value) => updateInquiryStatus(inquiry.id, value)}
                            >
                              <SelectTrigger className="w-[180px] font-lato">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Inquiry Received">Inquiry Received</SelectItem>
                                <SelectItem value="Billing">Billing</SelectItem>
                                <SelectItem value="Confirmed">Confirmed</SelectItem>
                                <SelectItem value="Packaging">Packaging</SelectItem>
                                <SelectItem value="In Transit">In Transit</SelectItem>
                                <SelectItem value="Delivered">Delivered</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedInquiry(inquiry)}
                              className="font-lato"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-tenor">Confirm Changes</DialogTitle>
            <DialogDescription className="font-lato">
              Are you sure you want to apply these changes?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="font-lato">
              Cancel
            </Button>
            <Button onClick={confirmAction} className="font-tenor">
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inquiry Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-tenor">Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 font-lato">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Customer</Label>
                  <p className="text-base">{selectedInquiry.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Contact</Label>
                  <p className="text-base">{selectedInquiry.contact}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <p className="text-base">{new Date(selectedInquiry.date).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <p className="text-base">{selectedInquiry.status}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Products</Label>
                <div className="space-y-2 mt-2">
                  {selectedInquiry.items?.map((item: any, idx: number) => (
                    <div key={idx} className="border border-border p-3 rounded">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Edit Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-tenor">Edit Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-lato">Product Name</Label>
                  <Input
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="font-lato"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-lato">Price</Label>
                  <Input
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: e.target.value })
                    }
                    className="font-lato"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-lato">Description</Label>
                <Textarea
                  value={editingProduct.description || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  rows={3}
                  className="font-lato"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-lato">Stock</Label>
                  <Input
                    type="number"
                    value={editingProduct.stock || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })
                    }
                    className="font-lato"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-lato">Visible</Label>
                  <Switch
                    checked={editingProduct.visible !== false}
                    onCheckedChange={(checked) =>
                      setEditingProduct({ ...editingProduct, visible: checked })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProduct(null)} className="font-lato">
                Cancel
              </Button>
              <Button onClick={() => updateProduct(editingProduct)} className="font-tenor">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Admin;