import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Download, Upload, X } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Content Management State
  const [heroHeading, setHeroHeading] = useState("Vision Statement");
  const [heroSubheading, setHeroSubheading] = useState("Description");
  const [heroCTA, setHeroCTA] = useState("DISCOVER");
  
  // Product Management State
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Inquiry State
  const [inquiries, setInquiries] = useState<any[]>([]);

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
      setHeroHeading(data.hero?.heading || "Vision Statement");
      setHeroSubheading(data.hero?.subheading || "Description");
      setHeroCTA(data.hero?.cta || "DISCOVER");
    }

    // Load products
    const productsData = localStorage.getItem("admin_products");
    if (productsData) {
      setProducts(JSON.parse(productsData));
    } else {
      // Load from products.json as default
      import("@/data/products.json").then((data) => {
        setProducts(data.products);
      });
    }

    // Load inquiries
    const inquiriesData = localStorage.getItem("admin_inquiries");
    if (inquiriesData) {
      setInquiries(JSON.parse(inquiriesData));
    }
  };

  const handleLogin = () => {
    // Simple UI-only auth
    if (username === "admin" && password === "admin123") {
      localStorage.setItem("srisha_admin", "true");
      setIsAuthenticated(true);
      loadAdminData();
    } else {
      alert("Invalid credentials. Use admin / admin123");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("srisha_admin");
    setIsAuthenticated(false);
    navigate("/");
  };

  const saveContent = () => {
    const contentData = {
      hero: {
        heading: heroHeading,
        subheading: heroSubheading,
        cta: heroCTA,
      },
    };
    localStorage.setItem("admin_content", JSON.stringify(contentData));
    alert("Content saved! Note: This is UI-only, refresh page to see original content.");
  };

  const saveProducts = () => {
    localStorage.setItem("admin_products", JSON.stringify(products));
    alert("Products saved!");
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
      description: "Product description",
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Default"],
      stock: 10,
    };
    setProducts([...products, newProduct]);
    setEditingProduct(newProduct);
  };

  const updateProduct = (updatedProduct: any) => {
    setProducts(products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const exportData = () => {
    const data = {
      content: JSON.parse(localStorage.getItem("admin_content") || "{}"),
      products: products,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "srisha-admin-export.json";
    a.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-tenor text-3xl text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter credentials to access admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Sign In
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Demo: admin / admin123
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto pt-32 pb-20 px-4 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-tenor text-4xl">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="content">Content Management</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          </TabsList>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Manage hero section content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Heading</Label>
                  <Input
                    value={heroHeading}
                    onChange={(e) => setHeroHeading(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subheading</Label>
                  <Input
                    value={heroSubheading}
                    onChange={(e) => setHeroSubheading(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input value={heroCTA} onChange={(e) => setHeroCTA(e.target.value)} />
                </div>
                <Button onClick={saveContent}>Save Content</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hero Carousel Images</CardTitle>
                <CardDescription>Upload images to /public/assets/</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Image management coming soon. Currently using default images from
                  /public/assets/
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-tenor text-2xl">Manage Products</h2>
              <div className="flex gap-2">
                <Button onClick={addProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
                <Button variant="outline" onClick={saveProducts}>
                  Save All
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-6">
                    {editingProduct?.id === product.id ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-tenor text-xl">Edit Product</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingProduct(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Product Name</Label>
                            <Input
                              value={editingProduct.name}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Price</Label>
                            <Input
                              value={editingProduct.price}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  price: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Stock</Label>
                            <Input
                              type="number"
                              value={editingProduct.stock}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  stock: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2 flex items-center justify-between">
                            <Label>Visible</Label>
                            <Switch
                              checked={editingProduct.visible}
                              onCheckedChange={(checked) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  visible: checked,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={editingProduct.description}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => updateProduct(editingProduct)}>
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingProduct(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-tenor text-lg">{product.name}</h3>
                          <p className="text-muted-foreground">{product.price}</p>
                          <p className="text-sm text-muted-foreground">
                            Stock: {product.stock} | Visible:{" "}
                            {product.visible ? "Yes" : "No"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingProduct(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Inquiries</CardTitle>
                <CardDescription>
                  View all product inquiries from customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inquiries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No inquiries yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <div
                        key={inquiry.id}
                        className="border-b border-border pb-4 last:border-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-tenor">{inquiry.productName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Size: {inquiry.size}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Customer: {inquiry.user?.name || "Anonymous"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(inquiry.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Admin;
