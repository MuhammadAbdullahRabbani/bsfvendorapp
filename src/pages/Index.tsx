import React, { useState, useEffect, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Calendar as DatePicker } from "../components/ui/calendar";
import { CalendarIcon, Plus, Search, Download, Upload, Users, Package } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { ThemeToggle } from "../components/ThemeToggle";
import { VendorCard } from "../components/VendorCard";
import { DailyVendorTable } from "../components/DailyVendorTable";
import { VendorForm } from "../components/VendorForm";
import { LifetimeVendor, DailyVendor, VendorFilters } from "../types/vendor";
import type { InventoryItem } from "../types/vendor";
import { exportLifetimeVendors, exportDailyVendors, exportAllVendors, importFromExcel } from "../utils/excelUtils";
import { toast } from "sonner";
import DailyVendorList from "../components/DailyVendorList";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, addDoc , updateDoc, deleteDoc, doc} from "firebase/firestore";
import { useNavigate } from "react-router-dom";                
import UserStatusBadge from "../components/ui/UserStatusBadge";
import { useAuthStore } from "@/stores/authStore";   
import { LogOut } from "lucide-react";          
import { addVendor, updateVendor, deleteVendor } from "../vendorService";
import { FiBox } from "react-icons/fi";
import { Pencil, Trash2, Check, X } from "lucide-react";


const Index = () => {
  // Inventory state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  // inline edit state for Inventory
const [editingItemId, setEditingItemId] = useState<string | null>(null);
const [editValue, setEditValue] = useState("");

const startEdit = (item: InventoryItem) => {
  setEditingItemId(item.id);
  setEditValue(item.item);
};

const cancelEdit = () => {
  setEditingItemId(null);
  setEditValue("");
};


  const [lifetimeVendors, setLifetimeVendors] = useState<LifetimeVendor[]>([]);
  const [dailyVendors, setDailyVendors] = useState<DailyVendor[]>([]);
  const [showForm, setShowForm] =
    useState<{ type: "lifetime" | "daily"; vendor?: LifetimeVendor | DailyVendor | null } | null>(null);
  const [activeTab, setActiveTab] = useState<"inventory" | "lifetime" | "daily">("lifetime");

  const [filters, setFilters] = useState<VendorFilters>({
    searchQuery: "",
    ratingFilter: undefined,
    paymentTimeFilter: undefined,
    unitFilter: undefined,
    paymentDate: undefined,
  });

  useEffect(() => {
    const unsubInventory = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
      setInventoryItems(rows);
    });

    const unsubLifetime = onSnapshot(collection(db, "lifetime"), (snapshot) => {
      const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as LifetimeVendor[];
      setLifetimeVendors(rows);
    });

    const unsubDaily = onSnapshot(collection(db, "daily"), (snapshot) => {
      const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as DailyVendor[];
      setDailyVendors(rows);
    });

    return () => {
      unsubInventory();
      unsubLifetime();
      unsubDaily();
    };
  }, []);

  const handleSaveVendor = async (vendor: LifetimeVendor | DailyVendor) => {
  try {
    // ✅ Enforce: items must exist in Inventory
    if ("itemName" in vendor) {
      // DailyVendor
      if (!inventoryNames.includes(norm(vendor.itemName))) {
        toast.error("Select an item from Inventory for Daily Vendor.");
        return;
      }
    } else if ("top5Items" in vendor) {
      // LifetimeVendor (allow empty, but if provided they must exist)
      const invalid = (vendor.top5Items || [])
        .map(norm)
        .filter(v => v && !inventoryNames.includes(v));
      if (invalid.length) {
        toast.error(`These items are not in Inventory: ${invalid.join(", ")}`);
        return;
      }
    }

    const collectionName =
      (showForm?.type || (activeTab === "lifetime" ? "lifetime" : "daily")) === "lifetime"
        ? "lifetime"
        : "daily";
    const isEditing = Boolean(showForm?.vendor?.id);

    if (isEditing && showForm?.vendor) {
      const vendorId = (showForm.vendor as LifetimeVendor | DailyVendor).id;
      await updateVendor(collectionName, vendorId, vendor);
      toast.success(`${collectionName} vendor updated successfully!`);
    } else {
      const result = await addVendor(collectionName, vendor);
      if (result?.id) {
        toast.success(`${collectionName} vendor added successfully!`);
      } else {
        throw new Error("Add vendor failed: No ID returned");
      }
    }

    setShowForm(null);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(" Vendor Save Error:", e.message);
      toast.error(`Failed to save vendor: ${e.message}`);
    } else {
      console.error(" Vendor Save Error:", e);
      toast.error("Failed to save vendor: Unknown error");
    }
  }
};


  const navigate = useNavigate();
  const signOutUser = useAuthStore((s) => s.signOutUser);
  const handleLogout = async () => {
    await signOutUser();
    navigate("/signin");
  };

  const handleDeleteVendor = async (id: string) => {
    try {
      const collectionName = activeTab === "lifetime" ? "lifetime" : "daily";
      await deleteVendor(collectionName, id);
      toast.success("Vendor deleted successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete vendor.");
    }
  };

  const toISO = (d?: Date) => (d ? d.toISOString().slice(0, 10) : undefined);
  const inc = (s: string | undefined | null, q: string) => (s ?? "").toLowerCase().includes(q);

  const matchesInventorySearch = (i: InventoryItem, q: string) => {
    if (!q) return true;
    return inc(i.item, q) || inc(i.id, q);
  };

  const matchesLifetimeSearch = (v: LifetimeVendor, q: string) => {
    if (!q) return true;
    return (
      inc(v.name, q) ||
      inc(v.contact, q) ||
      inc(v.address, q) ||
      (Array.isArray(v.top5Items) && v.top5Items.some((i) => inc(i, q)))
    );
  };

  const matchesDailySearch = (v: DailyVendor, q: string) => {
    if (!q) return true;
    return inc(v.name, q) || inc(v.itemName, q) || inc(v.contact, q);
  };

  const filteredInventory = useMemo(() => {
    let rows = [...inventoryItems];
    const q = (filters.searchQuery || "").trim().toLowerCase();
    if (q) rows = rows.filter((i) => matchesInventorySearch(i, q));
    return rows;
  }, [inventoryItems, filters.searchQuery]);
  // normalized list of inventory item names
const inventoryNames = useMemo(
  () => inventoryItems.map(i => (i.item || "").trim().toLowerCase()),
  [inventoryItems]
);
const norm = (s?: string) => (s ?? "").trim().toLowerCase();


  const filteredLifetimeVendors = useMemo(() => {
    let rows = [...lifetimeVendors];
    const q = (filters.searchQuery || "").trim().toLowerCase();
    if (q) rows = rows.filter((v) => matchesLifetimeSearch(v, q));
    if (typeof filters.ratingFilter === "number") {
      rows = rows.filter((v) => (v.vendorRating ?? 0) >= filters.ratingFilter!);
    }
    if (filters.paymentTimeFilter) {
      rows = rows.filter((v) => v.paymentTime === filters.paymentTimeFilter);
    }
    return rows;
  }, [lifetimeVendors, filters.searchQuery, filters.ratingFilter, filters.paymentTimeFilter]);

  const filteredDailyVendors = useMemo(() => {
    let rows = [...dailyVendors];
    const q = (filters.searchQuery || "").trim().toLowerCase();
    if (q) rows = rows.filter((v) => matchesDailySearch(v, q));
    if (filters.unitFilter) {
      rows = rows.filter((v) => v.unitOfMeasurement === filters.unitFilter);
    }
    if (filters.paymentDate) {
      const iso = toISO(filters.paymentDate);
      rows = rows.filter((v) => v.lastDealDate === iso);
    }
    return rows;
  }, [dailyVendors, filters.searchQuery, filters.unitFilter, filters.paymentDate]);

  const stats = useMemo(
    () => ({
      totalInventory: filteredInventory.length,
      totalLifetime: filteredLifetimeVendors.length,
      totalDaily: filteredDailyVendors.length,
      avgRating:
        filteredLifetimeVendors.length > 0
          ? (
              filteredLifetimeVendors.reduce((sum, v) => sum + (v.vendorRating || 0), 0) /
              filteredLifetimeVendors.length
            ).toFixed(1)
          : "0.0",
    }),
    [filteredInventory, filteredLifetimeVendors, filteredDailyVendors]
  );

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importFromExcel(file)
      .then(({ lifetimeVendors: importedLifetime, dailyVendors: importedDaily }) => {
        importedLifetime.forEach((v) => addVendor("lifetime", v));
        importedDaily.forEach((v) => addVendor("daily", v));
        toast.success("Data imported successfully!");
      })
      .catch(() => toast.error("Failed to import data. Please check the file format."));
  };

  const handleExportAll = () => {
    exportAllVendors(lifetimeVendors, dailyVendors);
    toast.success("All vendors exported successfully!");
  };
  const handleExportLifetime = () => {
    if (lifetimeVendors.length === 0) {
      toast.error("No lifetime vendors to export");
      return;
    }
    exportLifetimeVendors(lifetimeVendors);
    toast.success("Lifetime vendors exported successfully!");
  };
  const handleExportDaily = () => {
    if (dailyVendors.length === 0) {
      toast.error("No daily vendors to export");
      return;
    }
    exportDailyVendors(dailyVendors);
    toast.success("Daily vendors exported successfully!");
  };

  // Add Inventory item
const handleAddInventoryItem = async () => {
  const value = newItemName.trim();

  if (!value) {
    toast.error("Please enter an item name");
    return;
  }

  // Normalize (to avoid case duplicates like 'Zeera' vs 'zeera')
  const norm = (s: string) => s.trim().toLowerCase();
  const exists = inventoryItems.some((i) => norm(i.item) === norm(value));

  if (exists) {
    toast.error(`"${value}" already exists in Inventory`);
    setNewItemName("");
    return;
  }

  try {
    await addDoc(collection(db, "inventory"), { item: value });
    toast.success(`"${value}" added successfully`);
    setShowInventoryForm(false);
    setNewItemName("");
  } catch (e) {
    console.error(e);
    toast.error("Failed to add item");
  }
};

  const handleUpdateInventoryItem = async (id: string, value: string) => {
  const v = value.trim();
  if (!v) {
    toast.error("Item name cannot be empty");
    return;
  }
  try {
    await updateDoc(doc(db, "inventory", id), { item: v });
    toast.success("Item updated");
    cancelEdit();
  } catch (e) {
    console.error(e);
    toast.error("Failed to update item");
  }
};

const handleDeleteInventoryItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, "inventory", id));
  } catch (e) {
    console.error(e);
    toast.error("Failed to delete item");
  }
};


  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
<div className="glass-card mb-6 animate-fade-in">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 p-4 md:p-6">
    {/* Left Branding */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 md:gap-4 mb-1.5">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-material-md shrink-0">
          <Package className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent truncate">
            Black Source
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">From Source to Success</p>
        </div>
      </div>
    </div>

    {/* Right Controls */}
    <div
      className="flex w-full md:w-auto items-center md:items-stretch gap-2 md:gap-3
                 flex-wrap md:flex-nowrap justify-between md:justify-end"
    >
      {/* User badge + theme */}
      <div className="flex items-center gap-2 md:gap-3">
        <UserStatusBadge />
        <ThemeToggle />
      </div>

      {/* Export (icon on mobile, text on desktop) */}
      <DropdownMenu>
        {/* Mobile icon */}
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden shrink-0">
            <Download className="w-5 h-5" />
            <span className="sr-only">Export</span>
          </Button>
        </DropdownMenuTrigger>
        {/* Desktop text */}
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="hidden md:inline-flex export-button shrink-0">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="glass-card">
          <DropdownMenuItem onClick={handleExportAll} className="cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            All Vendors (Combined)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportLifetime} className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            Lifetime Vendors Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportDaily} className="cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            Daily Vendors Only
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import (icon on mobile, text on desktop) */}
      <label className="shrink-0">
        <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
        {/* Desktop */}
        <Button variant="outline" size="sm" asChild className="hidden md:inline-flex theme-transition">
          <span className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </span>
        </Button>
        {/* Mobile icon */}
        <Button variant="outline" size="icon" asChild className="md:hidden">
          <span className="cursor-pointer">
            <Upload className="w-5 h-5" />
            <span className="sr-only">Import</span>
          </span>
        </Button>
      </label>

      {/* Logout (icon on mobile, text on desktop) */}
      {/* Desktop */}
      <Button
        onClick={handleLogout}
        className="hidden md:inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md shrink-0"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
      {/* Mobile icon */}
      <Button
        onClick={handleLogout}
        size="icon"
        className="md:hidden bg-red-600 hover:bg-red-700 text-white rounded-md shrink-0"
        aria-label="Logout"
        title="Logout"
      >
        <LogOut className="w-5 h-5" />
      </Button>
    </div>
  </div>
</div>


        {/* Stats Section */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  {/* Inventory Items */}
  <Card className="vendor-card group hover:scale-105 transition-transform">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
      <div className="w-8 h-8 bg-gradient-to-r from-[#FF8C42] to-[#FFB347] rounded-lg flex items-center justify-center shadow-md">
        <FiBox className="h-4 w-4 text-white" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-amber-500 mb-1">{stats.totalInventory}</div>
      <p className="text-xs text-muted-foreground">Active stock items</p>
    </CardContent>
  </Card>

  {/* Lifetime Vendors */}
  <Card className="vendor-card group hover:scale-105 transition-transform">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Lifetime Vendors</CardTitle>
      <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
        <Users className="h-4 w-4 text-primary-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-primary mb-1">{stats.totalLifetime}</div>
      <p className="text-xs text-muted-foreground">Long-term partnerships</p>
    </CardContent>
  </Card>

  {/* Daily Vendors */}
  <Card className="vendor-card group hover:scale-105 transition-transform">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Daily Vendors</CardTitle>
      <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center shadow-md">
        <Package className="h-4 w-4 text-accent-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-accent mb-1">{stats.totalDaily}</div>
      <p className="text-xs text-muted-foreground">Daily transactions</p>
    </CardContent>
  </Card>

  {/* Average Rating */}
  <Card className="vendor-card group hover:scale-105 transition-transform">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
      <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center shadow-md">
        <div className="text-success-foreground font-bold">★</div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-success mb-1">{stats.avgRating}</div>
      <p className="text-xs text-muted-foreground">Quality score</p>
    </CardContent>
  </Card>
</div>

        {/* Search */}
        <Card className="vendor-card mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search vendors..."
                  value={filters.searchQuery}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      searchQuery: e.target.value,
                    }))
                  }
                  className="pl-10 material-input"
                />
              </div>

              {activeTab === "lifetime" && (
                <>
                  <Select
                    value={filters.ratingFilter?.toString() || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        ratingFilter: value !== "all" ? Number(value) : undefined,
                      }))
                    }
                  >
                    <SelectTrigger className="w-40 material-input">
                      <SelectValue placeholder="Min Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="2">2+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "inventory" | "lifetime" | "daily")}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 glass-card">
            <TabsTrigger
              value="inventory"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground theme-transition"
            >
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="lifetime"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground theme-transition"
            >
              <Users className="w-4 h-4 mr-2" />
              Lifetime Vendors
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              className="data-[state=active]:bg-gradient-accent data-[state=active]:text-accent-foreground theme-transition"
            >
              <Package className="w-4 h-4 mr-2" />
              Daily Vendors
            </TabsTrigger>
          </TabsList>

          {/* INVENTORY TAB — TABLE, NO CARDS */}
<TabsContent value="inventory" className="space-y-6">
  <Card className="glass-card">
    <div className="section-header">
      <div>
        <h3 className="text-lg font-semibold text-card-foreground">Inventory</h3>
        <p className="text-sm text-muted-foreground">
          {filteredInventory.length} item{filteredInventory.length !== 1 ? "s" : ""} found
        </p>
      </div>
    </div>
  </Card>

  {/* Empty state */}
  {filteredInventory.length === 0 ? (
    <Card className="vendor-card">
      <CardContent className="text-center py-16">
        <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-muted-foreground mb-2">No inventory items found</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {filters.searchQuery ? "Try adjusting your search" : "Add your first item"}
        </p>
        <Button onClick={() => setShowInventoryForm(true)} className="export-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </CardContent>
    </Card>
  ) : (
    /* TABLE (mobile-friendly, no IDs shown) */
    <div className="overflow-x-auto rounded-xl glass-card">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-900/50">
          <tr>
            <th className="text-left px-4 md:px-5 py-3 font-semibold">Item</th>
            <th className="text-right px-4 md:px-5 py-3 font-semibold w-40">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.map((it, idx) => (
            <tr
              key={it.id}
              className={`border-t border-white/5 ${idx % 2 === 0 ? "bg-black/10" : "bg-transparent"}`}
            >
              <td className="px-4 md:px-5 py-3 align-middle">
                {editingItemId === it.id ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Item name"
                    className="material-input h-9"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium">{it.item}</span>
                )}
              </td>
              <td className="px-4 md:px-5 py-3 align-middle">
                <div className="flex items-center justify-end gap-2">
                  {editingItemId === it.id ? (
                    <>
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-success text-success-foreground"
                        onClick={() => handleUpdateInventoryItem(it.id, editValue)}
                        aria-label="Save"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={cancelEdit}
                        aria-label="Cancel"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => startEdit(it)}
                        aria-label="Edit"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleDeleteInventoryItem(it.id)}
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

  {/* Inventory FAB — right-bottom */}
  <button
    onClick={() => setShowInventoryForm(true)}
    className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg 
               bg-gradient-to-r from-[#FF8C42] to-[#FFB347] text-white 
               hover:scale-110 hover:shadow-xl transition-all duration-300"
    aria-label="Add inventory item"
  >
    <Plus className="w-6 h-6" />
  </button>
</TabsContent>


          {/* Lifetime Vendors */}
          <TabsContent value="lifetime" className="space-y-6">
            <Card className="glass-card">
              <div className="section-header">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Lifetime Vendors</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredLifetimeVendors.length} vendor
                    {filteredLifetimeVendors.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <Button
                  onClick={handleExportLifetime}
                  variant="outline"
                  size="sm"
                  className="export-button"
                  disabled={lifetimeVendors.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Lifetime
                </Button>
              </div>
            </Card>

            {filteredLifetimeVendors.length === 0 ? (
              <Card className="vendor-card">
                <CardContent className="text-center py-16">
                  <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">
                    No lifetime vendors found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {filters.searchQuery ? "Try adjusting your search filters" : "Add your first lifetime vendor"}
                  </p>
                  <Button onClick={() => setShowForm({ type: "lifetime" })} className="export-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lifetime Vendor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLifetimeVendors.map((vendor, index) => (
                  <div key={vendor.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <VendorCard
                      vendor={vendor}
                      type="lifetime"
                      onEdit={(v) => setShowForm({ type: "lifetime", vendor: v })}
                      onDelete={(id) => handleDeleteVendor(id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Daily Vendors */}
          <TabsContent value="daily" className="space-y-6">
            <Card className="glass-card">
              <div className="section-header">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Daily Vendors</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredDailyVendors.length} vendor
                    {filteredDailyVendors.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <Button
                  onClick={handleExportDaily}
                  variant="outline"
                  size="sm"
                  className="export-button"
                  disabled={dailyVendors.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Daily
                </Button>
              </div>
            </Card>

            {dailyVendors.length === 0 ? (
              <Card className="vendor-card">
                <CardContent className="text-center py-16">
                  <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">No daily vendors found</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {filters.searchQuery ? "Try adjusting your search filters" : "Add your first daily vendor"}
                  </p>
                  <Button onClick={() => setShowForm({ type: "daily" })} className="export-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Daily Vendor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DailyVendorTable
                vendors={filteredDailyVendors}
                onEdit={(v) => setShowForm({ type: "daily", vendor: v })}
                onDelete={(id) => handleDeleteVendor(id)}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* FAB for Vendor tabs (unchanged, right-bottom). Hidden on Inventory */}
        {activeTab !== "inventory" && (
          <button onClick={() => setShowForm({ type: activeTab as "lifetime" | "daily" })} className="fab">
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Inventory Simple Modal */}
        {showInventoryForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowInventoryForm(false)} />
            <div className="relative w-[95%] max-w-md glass-card p-6 animate-slide-up">
              <h3 className="text-lg font-semibold mb-4">Add Inventory Item</h3>
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name"
                className="material-input mb-4"
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowInventoryForm(false)}>
                  Cancel
                </Button>
                <Button className="export-button" onClick={handleAddInventoryItem}>
                  Add Item
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Vendor Modal */}
       {showForm && (
  <VendorForm
    type={showForm.type}
    vendor={showForm.vendor}
    onSave={handleSaveVendor}
    onClose={() => setShowForm(null)}
    inventoryItems={inventoryItems.map((i) => i.item)}  // ⬅️ add this line
  />
)}

      </div>
    </div>
  );
};

export default Index;
