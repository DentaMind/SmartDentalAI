import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, 
  Package, 
  Search, 
  PlusCircle, 
  ShoppingCart, 
  Truck, 
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

// Supply item form schema
const supplyItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  manufacturer: z.string().optional(),
  currentStock: z.number().int().nonnegative("Stock must be non-negative"),
  reorderThreshold: z.number().int().nonnegative("Threshold must be non-negative"),
  unitPrice: z.number().nonnegative("Price must be non-negative"),
  orderUnit: z.string().optional(),
  locationInOffice: z.string().optional(),
});

type SupplyItemFormValues = z.infer<typeof supplyItemSchema>;

// Supply order form schema
const supplyOrderSchema = z.object({
  orderDate: z.string().min(1, "Order date is required"),
  vendorId: z.number().positive("Please select a vendor"),
  status: z.string().min(1, "Status is required"),
  items: z.array(
    z.object({
      supplyItemId: z.number().positive(),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      notes: z.string().optional(),
    })
  ).nonempty("At least one item must be added"),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  totalAmount: z.number().nonnegative(),
});

type SupplyOrderFormValues = z.infer<typeof supplyOrderSchema>;

export function SuppliesManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateItemDialogOpen, setIsCreateItemDialogOpen] = useState(false);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Setup form with default values for supply item
  const itemForm = useForm<SupplyItemFormValues>({
    resolver: zodResolver(supplyItemSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      sku: "",
      manufacturer: "",
      currentStock: 0,
      reorderThreshold: 5,
      unitPrice: 0,
      orderUnit: "each",
      locationInOffice: "",
    },
  });

  // Setup form with default values for supply order
  const orderForm = useForm<SupplyOrderFormValues>({
    resolver: zodResolver(supplyOrderSchema),
    defaultValues: {
      orderDate: new Date().toISOString().split('T')[0],
      vendorId: 0,
      status: "pending",
      items: [],
      expectedDeliveryDate: "",
      notes: "",
      totalAmount: 0,
    },
  });

  // Mock data for development - this will be replaced with actual API calls
  const mockSupplyItems = [
    {
      id: 1,
      name: "Composite Resin A2",
      category: "restorative_materials",
      description: "Light-cured composite resin for anterior restorations",
      sku: "CR-A2-5G",
      manufacturer: "3M ESPE",
      currentStock: 8,
      reorderThreshold: 5,
      unitPrice: 45.99,
      orderUnit: "syringe",
      locationInOffice: "Supply Room Shelf 2",
      updatedAt: "2025-03-01"
    },
    {
      id: 2,
      name: "Dental Anesthetic Carpules",
      category: "ppe",
      description: "2% Lidocaine with 1:100,000 epinephrine",
      sku: "LID-2-100",
      manufacturer: "Henry Schein",
      currentStock: 2,
      reorderThreshold: 10,
      unitPrice: 32.50,
      orderUnit: "box",
      locationInOffice: "Medication Cabinet",
      updatedAt: "2025-03-10"
    },
    {
      id: 3,
      name: "Nitrile Gloves Medium",
      category: "ppe",
      description: "Powder-free nitrile examination gloves",
      sku: "NIT-MED-100",
      manufacturer: "SafeTouch",
      currentStock: 15,
      reorderThreshold: 10,
      unitPrice: 12.99,
      orderUnit: "box",
      locationInOffice: "Supply Room Shelf 1",
      updatedAt: "2025-03-15"
    }
  ];

  const mockSupplyOrders = [
    {
      id: 1,
      orderDate: "2025-03-10",
      vendorId: 1,
      vendorName: "Patterson Dental",
      status: "delivered",
      items: [
        {
          supplyItemId: 1,
          name: "Composite Resin A2",
          quantity: 5,
          unitPrice: 45.99,
          notes: ""
        },
        {
          supplyItemId: 3,
          name: "Nitrile Gloves Medium",
          quantity: 10,
          unitPrice: 12.99,
          notes: ""
        }
      ],
      expectedDeliveryDate: "2025-03-15",
      deliveredDate: "2025-03-14",
      notes: "",
      totalAmount: 359.85
    },
    {
      id: 2,
      orderDate: "2025-03-18",
      vendorId: 2,
      vendorName: "Henry Schein",
      status: "processing",
      items: [
        {
          supplyItemId: 2,
          name: "Dental Anesthetic Carpules",
          quantity: 5,
          unitPrice: 32.50,
          notes: "Urgent order"
        }
      ],
      expectedDeliveryDate: "2025-03-25",
      deliveredDate: null,
      notes: "Rush delivery requested",
      totalAmount: 162.50
    }
  ];

  const mockVendors = [
    { id: 1, name: "Patterson Dental" },
    { id: 2, name: "Henry Schein" },
    { id: 3, name: "Benco Dental" },
    { id: 4, name: "Darby Dental Supply" }
  ];

  // Simulated API calls with mock data
  const { 
    data: supplyItems = mockSupplyItems,
    isLoading: isItemsLoading, 
    isError: isItemsError
  } = useQuery<typeof mockSupplyItems>({
    queryKey: ['/api/supply-items'],
    enabled: false, // Disabled for now as we're using mock data
  });

  const { 
    data: supplyOrders = mockSupplyOrders, 
    isLoading: isOrdersLoading, 
    isError: isOrdersError 
  } = useQuery<typeof mockSupplyOrders>({
    queryKey: ['/api/supply-orders'],
    enabled: false, // Disabled for now as we're using mock data
  });

  const { 
    data: vendors = mockVendors, 
    isLoading: isVendorsLoading
  } = useQuery<typeof mockVendors>({
    queryKey: ['/api/vendors'],
    enabled: false, // Disabled for now as we're using mock data
  });

  // Handle form submissions
  async function onSubmitItem(values: SupplyItemFormValues) {
    try {
      // In a real implementation, this would submit to the API
      // await apiRequest('/api/supply-items', 'POST', values);
      
      toast({
        title: "Supply item created",
        description: "Item has been added to your inventory.",
      });
      
      setIsCreateItemDialogOpen(false);
      itemForm.reset();
      
      // In a real implementation, we would invalidate queries to refresh data
      // queryClient.invalidateQueries({ queryKey: ['/api/supply-items'] });
      
    } catch (error) {
      console.error("Error creating supply item:", error);
      toast({
        variant: "destructive",
        title: "Failed to create supply item",
        description: "There was an error adding the item to inventory.",
      });
    }
  }

  async function onSubmitOrder(values: SupplyOrderFormValues) {
    try {
      // In a real implementation, this would submit to the API
      // await apiRequest('/api/supply-orders', 'POST', values);
      
      toast({
        title: "Supply order created",
        description: "Order has been placed successfully.",
      });
      
      setIsCreateOrderDialogOpen(false);
      orderForm.reset();
      
      // In a real implementation, we would invalidate queries to refresh data
      // queryClient.invalidateQueries({ queryKey: ['/api/supply-orders'] });
      
    } catch (error) {
      console.error("Error creating supply order:", error);
      toast({
        variant: "destructive",
        title: "Failed to create order",
        description: "There was an error placing the order.",
      });
    }
  }

  // Define types based on mock data structure
  type SupplyItem = typeof mockSupplyItems[0];
  type SupplyOrder = typeof mockSupplyOrders[0];
  type OrderItem = SupplyOrder['items'][0];

  // Filter supply items based on search query, category filter, and low stock filter
  const filteredItems = supplyItems.filter((item: SupplyItem) => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === null || item.category === categoryFilter;
    
    const matchesLowStock = !lowStockFilter || item.currentStock <= item.reorderThreshold;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Filter supply orders based on search query and status filter
  const filteredOrders = supplyOrders.filter((order: SupplyOrder) => {
    const matchesSearch = searchQuery === "" || 
      order.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item: OrderItem) => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = statusFilter === null || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Status badge mapping for visual states
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </Badge>;
      case 'processing':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Truck className="h-3 w-3" />
          <span>Processing</span>
        </Badge>;
      case 'shipped':
        return <Badge variant="default" className="flex items-center gap-1">
          <Truck className="h-3 w-3" />
          <span>Shipped</span>
        </Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>Delivered</span>
        </Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Cancelled</span>
        </Badge>;
      case 'returned':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Returned</span>
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Error states for both tabs
  if (isItemsError && activeTab === "inventory") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading Inventory
          </CardTitle>
          <CardDescription>
            There was a problem loading the inventory. Please try refreshing the page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isOrdersError && activeTab === "orders") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading Orders
          </CardTitle>
          <CardDescription>
            There was a problem loading the orders. Please try refreshing the page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="inventory" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <TabsList className="mb-4 sm:mb-0">
            <TabsTrigger value="inventory" className="min-w-[120px]">
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="orders" className="min-w-[120px]">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
          </TabsList>

          {activeTab === "inventory" ? (
            <Dialog open={isCreateItemDialogOpen} onOpenChange={setIsCreateItemDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shrink-0">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Supply Item</DialogTitle>
                  <DialogDescription>
                    Add a new item to your supply inventory. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4 pt-4">
                    <FormField
                      control={itemForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter item name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="restorative_materials">Restorative Materials</SelectItem>
                              <SelectItem value="implant_components">Implant Components</SelectItem>
                              <SelectItem value="orthodontic_supplies">Orthodontic Supplies</SelectItem>
                              <SelectItem value="endodontic_materials">Endodontic Materials</SelectItem>
                              <SelectItem value="impression_materials">Impression Materials</SelectItem>
                              <SelectItem value="instruments">Instruments</SelectItem>
                              <SelectItem value="sterilization">Sterilization</SelectItem>
                              <SelectItem value="ppe">PPE</SelectItem>
                              <SelectItem value="office_supplies">Office Supplies</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="currentStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Stock</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="1" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={itemForm.control}
                        name="reorderThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reorder Threshold</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="1" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Notify when stock falls below this level
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="unitPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={itemForm.control}
                        name="orderUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Unit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="each">Each</SelectItem>
                                <SelectItem value="box">Box</SelectItem>
                                <SelectItem value="pack">Pack</SelectItem>
                                <SelectItem value="case">Case</SelectItem>
                                <SelectItem value="set">Set</SelectItem>
                                <SelectItem value="syringe">Syringe</SelectItem>
                                <SelectItem value="bottle">Bottle</SelectItem>
                                <SelectItem value="tube">Tube</SelectItem>
                                <SelectItem value="kit">Kit</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={itemForm.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU / Product Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter SKU" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="manufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturer</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter manufacturer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Enter item description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="locationInOffice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location in Office</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Supply Room Shelf 2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit">Save Item</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shrink-0">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Supply Order</DialogTitle>
                  <DialogDescription>
                    Place a new order for supplies. Select items, quantities, and vendor.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Order form would go here - simplified for now */}
                <div className="py-6 text-center text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>Order form implementation simplified for this demo</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => {
                      setIsCreateOrderDialogOpen(false);
                      toast({
                        title: "Order Created",
                        description: "Your order has been submitted successfully.",
                      });
                    }}
                  >
                    Create Sample Order
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="inventory" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Supply Inventory
              </CardTitle>
              <CardDescription>
                Manage your dental supply inventory, track stock levels, and reorder items.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={categoryFilter || ""}
                    onValueChange={(value) => setCategoryFilter(value === "" ? null : value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="restorative_materials">Restorative Materials</SelectItem>
                      <SelectItem value="implant_components">Implant Components</SelectItem>
                      <SelectItem value="orthodontic_supplies">Orthodontic Supplies</SelectItem>
                      <SelectItem value="endodontic_materials">Endodontic Materials</SelectItem>
                      <SelectItem value="impression_materials">Impression Materials</SelectItem>
                      <SelectItem value="instruments">Instruments</SelectItem>
                      <SelectItem value="sterilization">Sterilization</SelectItem>
                      <SelectItem value="ppe">PPE</SelectItem>
                      <SelectItem value="office_supplies">Office Supplies</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant={lowStockFilter ? "default" : "outline"} 
                    onClick={() => setLowStockFilter(!lowStockFilter)}
                    className="whitespace-nowrap"
                  >
                    <AlertCircle className={`h-4 w-4 ${lowStockFilter ? 'mr-2' : 'mr-2 text-muted-foreground'}`} />
                    Low Stock Only
                  </Button>
                </div>
              </div>
              
              {isItemsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                filteredItems.length === 0 ? (
                  <div className="text-center py-10">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium">No items found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || categoryFilter || lowStockFilter
                        ? "Try adjusting your search or filter criteria."
                        : "Get started by adding items to your inventory."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-center">
                            <div className="flex items-center justify-center">
                              <span>Stock</span>
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Reorder Threshold</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell className="capitalize">
                              {item.category.replace('_', ' ')}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center">
                                {item.currentStock <= item.reorderThreshold ? (
                                  <Badge variant="destructive" className="w-10 justify-center">
                                    {item.currentStock}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="w-10 justify-center">
                                    {item.currentStock}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.locationInOffice || "-"}</TableCell>
                            <TableCell>{item.reorderThreshold}</TableCell>
                            <TableCell>${item.unitPrice.toFixed(2)} / {item.orderUnit}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm">
                                Order
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
            
            <CardFooter className="border-t px-6 py-4">
              <div className="flex flex-col xs:flex-row gap-4 justify-between w-full">
                <div>
                  <p className="text-sm font-medium">Total Items: {filteredItems.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {supplyItems.filter((item: any) => item.currentStock <= item.reorderThreshold).length} items below reorder threshold
                  </p>
                </div>
                <Button variant="default" size="sm">
                  Generate Report
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Supply Orders
              </CardTitle>
              <CardDescription>
                Track your supply orders, deliveries, and order history.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select
                  value={statusFilter || ""}
                  onValueChange={(value) => setStatusFilter(value === "" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isOrdersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                filteredOrders.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium">No orders found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || statusFilter 
                        ? "Try adjusting your search or filter criteria."
                        : "Get started by creating your first order."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Order Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{order.vendorName}</TableCell>
                            <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                            <TableCell>{order.items.length} items</TableCell>
                            <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}