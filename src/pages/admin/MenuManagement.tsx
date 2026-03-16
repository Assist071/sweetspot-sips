import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Search, Tag, Box, Star, AlertCircle, Image as ImageIcon, Upload, Loader2, Settings2, Image as LucideImage, Droplets, Sparkles, Sliders } from "lucide-react";

export default function AdminMenu() {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [editProduct, setEditProduct] = useState<Tables<"products"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [sizes, setSizes] = useState<any[]>([]);
  const [sugarLevels, setSugarLevels] = useState<string[]>([]);
  const [iceLevels, setIceLevels] = useState<string[]>([]);
  const [toppings, setToppings] = useState<string[]>([]);

  // Size editing state
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizePrice, setNewSizePrice] = useState("");
  
  // Customization editing state
  const [newSugarLevel, setNewSugarLevel] = useState("");
  const [newIceLevel, setNewIceLevel] = useState("");
  const [flavorOptions, setFlavorOptions] = useState<string[]>([]);
  const [newFlavorOption, setNewFlavorOption] = useState("");
  const [newTopping, setNewTopping] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast({ title: "Image uploaded!", description: "Product image is ready." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Category management state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const fetchData = async () => {
    const [pRes, cRes] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    if (pRes.data) setProducts(pRes.data);
    if (cRes.data) setCategories(cRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setName(""); setDescription(""); setPrice(""); setCategoryId(""); setImageUrl(""); setIsAvailable(true); setIsFeatured(false);
    setStockQuantity("");
    setSizes([]);
    setSugarLevels([]);
    setIceLevels([]);
    setFlavorOptions([]);
    setToppings([]);
    setEditProduct(null);
  };

  const openEdit = (p: Tables<"products">) => {
    setEditProduct(p);
    setName(p.name);
    setDescription(p.description || "");
    setPrice(String(p.price));
    setCategoryId(p.category_id || "");
    setImageUrl(p.image_url || "");
    setIsAvailable(p.is_available);
    setIsFeatured(p.is_featured);
    setStockQuantity(String(p.stock_quantity || 0));
    setSizes((p as any).sizes || []);
    setSugarLevels(p.sugar_levels || []);
    setIceLevels(p.ice_levels || []);
    setFlavorOptions((p as any).flavor_options || []);
    setToppings(Array.isArray(p.toppings) ? (p.toppings as string[]) : []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data = {
      name, description: description || null, price: parseFloat(price) || 0,
      category_id: categoryId || null, image_url: imageUrl || null,
      is_available: isAvailable, is_featured: isFeatured,
      stock_quantity: parseInt(stockQuantity) || 0,
      sizes: sizes,
      sugar_levels: sugarLevels,
      ice_levels: iceLevels,
      flavor_options: flavorOptions,
      toppings: toppings,
    };

    let error;
    if (editProduct) {
      ({ error } = await supabase.from("products").update(data).eq("id", editProduct.id));
    } else {
      ({ error } = await supabase.from("products").insert(data));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editProduct ? "Product updated!" : "Product added!" });
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product deleted" });
      fetchData();
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { error } = await supabase.from("categories").insert({
      name: newCategoryName.trim(),
      sort_order: categories.length // Simple sort order
    });

    if (error) {
      toast({ title: "Error adding category", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category added!" });
      setNewCategoryName("");
      fetchData();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deletion failed", description: "Make sure no products are using this category.", variant: "destructive" });
    } else {
      toast({ title: "Category deleted" });
      fetchData();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categories.find(c => c.id === p.category_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-display font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">Customize your offerings and showcase your best flavors.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search drinks..."
              className="pl-11 h-11 rounded-2xl bg-white/50 backdrop-blur-sm border-white/20 focus:bg-white transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11 rounded-2xl border-primary/20 hover:bg-primary/5 font-bold px-6">
                <Tag className="h-4 w-4 mr-2" /> Categories
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] bg-white/95 backdrop-blur-xl border-white/40 shadow-card max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold">Manage Categories</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="rounded-xl h-12"
                  />
                  <Button onClick={handleAddCategory} className="h-12 w-12 rounded-xl" size="icon">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="bg-primary/5 rounded-[1.5rem] divide-y divide-primary/5 overflow-hidden max-h-[300px] overflow-y-auto border border-primary/5">
                  {categories.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground italic">No categories created yet.</p>
                  ) : (
                    categories.map((c) => (
                      <div key={c.id} className="p-4 flex items-center justify-between group hover:bg-white/50 transition-colors">
                        <span className="font-bold text-foreground/80">{c.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                          onClick={() => handleDeleteCategory(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-2xl font-bold px-8 shadow-soft">
                <Plus className="h-5 w-5 mr-1" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] bg-white/95 backdrop-blur-xl border-white/40 shadow-card max-w-2xl p-6 overflow-hidden">
              <DialogHeader className="pb-2 border-b border-primary/5">
                <DialogTitle className="font-display text-2xl font-black text-primary/80 uppercase tracking-tighter">
                  {editProduct ? "Modify Item" : "New Creation"}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4 rounded-xl bg-primary/5 p-1">
                  <TabsTrigger value="general" className="rounded-lg text-[8px] font-black uppercase tracking-widest gap-1 py-2">
                    <Settings2 className="h-3 w-3" /> Info
                  </TabsTrigger>
                  <TabsTrigger value="media" className="rounded-lg text-[8px] font-black uppercase tracking-widest gap-1 py-2">
                    <LucideImage className="h-3 w-3" /> Visual
                  </TabsTrigger>
                  <TabsTrigger value="options" className="rounded-lg text-[8px] font-black uppercase tracking-widest gap-1 py-2">
                    <Tag className="h-3 w-3" /> Pricing
                  </TabsTrigger>
                  <TabsTrigger value="customization" className="rounded-lg text-[8px] font-black uppercase tracking-widest gap-1 py-2">
                    <Sliders className="h-3 w-3" /> Customize
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 py-2 mt-0 focus-visible:outline-none">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Category</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger className="rounded-xl h-10 bg-white/50 text-xs"><SelectValue placeholder="Group" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Drink Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-10 bg-white/50 text-xs" placeholder="Name" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[70px] bg-white/50 py-2 text-xs" placeholder="What makes it special?" />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 flex-1">
                      <Box className="h-4 w-4 text-primary/60" />
                      <span className="text-[10px] font-bold text-foreground/80 flex-1">Available</span>
                      <Switch checked={isAvailable} onCheckedChange={setIsAvailable} className="scale-75" />
                    </div>
                    <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 flex-1">
                      <Star className="h-4 w-4 text-primary/60" />
                      <span className="text-[10px] font-bold text-foreground/80 flex-1">Featured</span>
                      <Switch checked={isFeatured} onCheckedChange={setIsFeatured} className="scale-75" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 py-2 mt-0 focus-visible:outline-none">
                  <div className="space-y-3">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Display Imagery</Label>
                    <div className="relative group/upload h-36 rounded-2xl overflow-hidden border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-2">
                      {imageUrl ? (
                        <>
                          <img src={imageUrl} alt="P" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 flex items-center justify-center transition-all">
                            <Label htmlFor="img-up" className="cursor-pointer bg-white text-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                              <Upload className="h-4 w-4" /> Change Image
                            </Label>
                          </div>
                        </>
                      ) : (
                        <>
                          {isUploading ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <Upload className="h-6 w-6 text-primary/40" />}
                          <Label htmlFor="img-up" className="cursor-pointer text-xs font-bold text-primary/60">Upload Product Image</Label>
                        </>
                      )}
                      <input id="img-up" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </div>
                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="rounded-xl h-10 bg-white/50 text-xs" placeholder="Or paste image link here..." />
                  </div>
                </TabsContent>

                <TabsContent value="options" className="space-y-4 py-2 mt-0 focus-visible:outline-none">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Base Price</Label>
                      <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-xl h-10 bg-white/50 font-bold text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Current Stock</Label>
                      <Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="rounded-xl h-10 bg-white/50 font-bold text-sm" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="customization" className="space-y-4 py-2 mt-0 focus-visible:outline-none">
                  <Tabs defaultValue="sizes" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 rounded-xl bg-primary/5 p-1 h-10">
                      <TabsTrigger value="sizes" className="rounded-lg text-[9px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Size</TabsTrigger>
                      <TabsTrigger value="custom" className="rounded-lg text-[9px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Options</TabsTrigger>
                      <TabsTrigger value="flavors" className="rounded-lg text-[9px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Extras</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sizes" className="space-y-4 mt-0 focus-visible:outline-none">
                      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-3">
                        <Label className="uppercase text-[9px] font-black tracking-widest text-primary/60 ml-1">Cup Size Variations (oz)</Label>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                          {sizes.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white/80 p-2 rounded-xl border border-primary/5 shadow-sm">
                              <span className="flex-1 text-xs font-bold">{s.name}</span>
                              <span className="text-[10px] font-black text-primary/60">+{s.price_adjustment} PHP</span>
                              <button onClick={() => setSizes(sizes.filter((_, i) => i !== idx))} className="h-7 w-7 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Input placeholder="e.g. 16oz" value={newSizeName} onChange={(e) => setNewSizeName(e.target.value)} className="h-10 text-xs rounded-xl flex-[2]" />
                          <Input type="number" placeholder="+ ₱" value={newSizePrice} onChange={(e) => setNewSizePrice(e.target.value)} className="h-10 text-xs rounded-xl flex-1 px-2" />
                          <Button variant="outline" className="h-10 w-10 rounded-xl border-primary/20" size="icon" onClick={() => {
                            if (newSizeName.trim()) {
                              setSizes([...sizes, { name: newSizeName.trim(), price_adjustment: parseFloat(newSizePrice) || 0 }]);
                              setNewSizeName(""); setNewSizePrice("");
                            }
                          }}>
                            <Plus className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4 mt-0 focus-visible:outline-none">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10 space-y-2">
                          <Label className="uppercase text-[8px] font-black tracking-widest text-primary/60 ml-1">Sugar Levels</Label>
                          <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
                            {sugarLevels.map((s, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/80 p-1.5 rounded-lg border border-primary/5">
                                <span className="flex-1 text-[10px] font-bold">{s}</span>
                                <button onClick={() => setSugarLevels(sugarLevels.filter((_, i) => i !== idx))} className="text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <Input placeholder="100%" value={newSugarLevel} onChange={(e) => setNewSugarLevel(e.target.value)} className="h-8 text-xs rounded-lg flex-1" />
                            <Button variant="outline" className="h-8 w-8 rounded-lg" size="icon" onClick={() => {
                              if (newSugarLevel.trim()) {
                                setSugarLevels([...sugarLevels, newSugarLevel.trim()]);
                                setNewSugarLevel("");
                              }
                            }}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10 space-y-2">
                          <Label className="uppercase text-[8px] font-black tracking-widest text-primary/60 ml-1">Ice Levels</Label>
                          <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
                            {iceLevels.map((i, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/80 p-1.5 rounded-lg border border-primary/5">
                                <span className="flex-1 text-[10px] font-bold">{i}</span>
                                <button onClick={() => setIceLevels(iceLevels.filter((_, i) => i !== idx))} className="text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <Input placeholder="Regular" value={newIceLevel} onChange={(e) => setNewIceLevel(e.target.value)} className="h-8 text-xs rounded-lg flex-1" />
                            <Button variant="outline" className="h-8 w-8 rounded-lg" size="icon" onClick={() => {
                              if (newIceLevel.trim()) {
                                setIceLevels([...iceLevels, newIceLevel.trim()]);
                                setNewIceLevel("");
                              }
                            }}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10 space-y-2">
                          <Label className="uppercase text-[8px] font-black tracking-widest text-primary/60 ml-1">Flavor Options</Label>
                          <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
                            {flavorOptions.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/80 p-1.5 rounded-lg border border-primary/5">
                                <span className="flex-1 text-[10px] font-bold">{f}</span>
                                <button onClick={() => setFlavorOptions(flavorOptions.filter((_, i) => i !== idx))} className="text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <Input placeholder="BBQ" value={newFlavorOption} onChange={(e) => setNewFlavorOption(e.target.value)} className="h-8 text-xs rounded-lg flex-1" />
                            <Button variant="outline" className="h-8 w-8 rounded-lg" size="icon" onClick={() => {
                              if (newFlavorOption.trim()) {
                                setFlavorOptions([...flavorOptions, newFlavorOption.trim()]);
                                setNewFlavorOption("");
                              }
                            }}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="flavors" className="space-y-4 mt-0 focus-visible:outline-none">
                      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-3">
                        <Label className="uppercase text-[9px] font-black tracking-widest text-primary/60 ml-1">Toppings & Extras</Label>
                        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1">
                          {toppings.map((t, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-primary/10 shadow-sm text-xs font-bold">
                              {t}
                              <button onClick={() => setToppings(toppings.filter((_, i) => i !== idx))} className="text-destructive hover:scale-110">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Input placeholder="Pearl, Jelly, etc." value={newTopping} onChange={(e) => setNewTopping(e.target.value)} className="h-10 text-xs rounded-xl flex-1" />
                          <Button variant="outline" className="h-10 w-10 rounded-xl" size="icon" onClick={() => {
                            if (newTopping.trim()) {
                              setToppings([...toppings, newTopping.trim()]);
                              setNewTopping("");
                            }
                          }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>

              <div className="pt-2">
                <Button className="w-full h-12 rounded-2xl font-bold text-base shadow-soft" onClick={handleSave} disabled={!name || (!price && sizes.length === 0)}>
                  {editProduct ? "Save Changes" : "Confirm Creation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      {products.length === 0 ? (
        <div className="text-center py-24 bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-primary/10">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="h-12 w-12 text-primary/40" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-2 text-foreground/80">No menu items yet</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Start building your menu by adding your signature milk tea flavors.</p>
          <Button onClick={() => setDialogOpen(true)} className="rounded-full px-10 shadow-soft">Add First Drink</Button>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-card border border-white/40 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 bg-white/50">
                <th className="py-6 px-8 font-black">Item</th>
                <th className="py-6 px-8 font-black">Category</th>
                <th className="py-6 px-8 font-black">Available Sizes</th>
                <th className="py-6 px-8 font-black">Featured</th>
                <th className="py-6 px-8 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-primary/[0.02] transition-colors"
                  >
                    {/* Item Column */}
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/5 border border-primary/5 flex-shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🧋</div>
                          )}
                        </div>
                        <div>
                          <p className="font-display font-bold text-foreground/90">{p.name}</p>
                          <p className={`text-[9px] font-black uppercase tracking-widest ${
                            p.stock_quantity === 0 ? 'text-destructive' : 
                            p.stock_quantity <= 10 ? 'text-orange-600' : 
                            'text-success/70'
                          }`}>
                            {p.stock_quantity === 0 ? 'Out of Stock' : 
                             p.stock_quantity <= 10 ? 'Low Stock' : 
                             'In Stock'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="py-5 px-8">
                      <span className="bg-primary/5 text-primary/70 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/5">
                        {categories.find(c => c.id === p.category_id)?.name || "Uncategorized"}
                      </span>
                    </td>

                    {/* Sizes Column */}
                    <td className="py-5 px-8">
                      <div className="flex flex-wrap gap-1.5">
                        {((p as any).sizes && (p as any).sizes.length > 0) ? (
                          (p as any).sizes.map((s: any, idx: number) => (
                            <span key={idx} className="bg-white border border-primary/10 px-2 py-0.5 rounded-lg text-[9px] font-bold text-primary/70">
                              {s.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground/40 text-[9px] font-bold">Standard</span>
                        )}
                      </div>
                    </td>

                    {/* Popular Column */}
                    <td className="py-5 px-8">
                      {p.is_featured ? (
                        <div className="flex items-center gap-1.5 text-primary">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Featured</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-5 px-8 text-right underline-none">
                      <div className="flex justify-end gap-1 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
