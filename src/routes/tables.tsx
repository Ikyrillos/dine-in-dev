"use client";

import { ResizableLayout } from "@/components/resizable-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartOperations, useClearCart } from "@/core/hooks/cart_hooks";
import { useAuth } from "@/core/hooks/use-auth";
import { useGetRestaurantById } from "@/core/hooks/use-restaurant-hooks";
import { useGetTables } from "@/core/hooks/use-tables-hooks";
import type { Table } from "@/core/models/TableModel";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/tables")({
  component: TableSelection,
  beforeLoad: ({ context }: {
    context: any;
  }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
        search: {
          redirect: "/tables",
        },
      });
    }
  },
});

export default function TableSelection() {
  const auth = useAuth();
  const navigate = useNavigate();
  const {
    data: restaurant,
    isLoading: isRestaurantLoading,
  } = useGetRestaurantById();

  useEffect(() => {
    if (restaurant?.data) {
      localStorage.setItem("x-foundation-id", restaurant.data.id);
    }
  }, [restaurant]);

  const {
    data: tables,
    isLoading: isTablesLoading,
    refetch: refetchTables,
  } = useGetTables();

  // Local state with hooks
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [defaultTabValue, setDefaultTabValue] = useState<string>("dine-in");

  const {
    cart,
    getCart,
    updateItem,
    removeItem,
  } = useCartOperations(selectedTable?.id || "");

  const clearCartMutation = useClearCart();

  // Store restaurant data in local state instead of localStorage for better React patterns
  useEffect(() => {
    if (restaurant?.data) {
      setRestaurantData(restaurant.data);
      // Only use localStorage for persistence if absolutely necessary
      // Consider using a more React-friendly approach like context or props
      refetchTables();
    }
  }, [restaurant?.data, refetchTables]);

  // Update default tab based on restaurant settings
  useEffect(() => {
    if (restaurantData) {
      // If dine-in is disabled but pickup is enabled, default to pickup
      if (!restaurantData.hasDineIn && restaurantData.hasPickup) {
        setDefaultTabValue("pickup");
      }
      // If pickup is disabled but dine-in is enabled, default to dine-in
      else if (restaurantData.hasDineIn && !restaurantData.hasPickup) {
        setDefaultTabValue("dine-in");
      }
      // If both are enabled, default to dine-in
      else if (restaurantData.hasDineIn && restaurantData.hasPickup) {
        setDefaultTabValue("dine-in");
      }
    }
  }, [restaurantData]);

  const getTableVariant = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-primary text-primary-foreground hover:bg-primary/90";
      case "empty":
        return "bg-background border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-primary/5";
      case "reserved":
        return "bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-200";
      default:
        return "bg-muted hover:bg-muted/80";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "occupied":
        return (
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        );
      case "empty":
        return <Badge variant="outline">Available</Badge>;
      case "reserved":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Reserved
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleTableClick = (table: Table) => {
    if (table.status === "free") {
      // Store table selection in component state or pass via navigation
      navigate({
        to: "/menu",
        search: {
          tableId: table.id,
        },
      });
    } else {
      setSelectedTable(table);
      setShowPaymentOptions(false);
    }

    getCart();
  };

  const handleOrderForTable = (tableId: string) => {
    navigate({
      to: "/menu",
      search: {
        tableId: tableId,
      },
    });
  };

  const handlePickupOrder = () => {
    navigate({
      to: "/menu",
      search: {
        orderType: "pickup",
      },
    });
  };

  const updateCartItemQuantity = (lineId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(lineId); // lineId = optionsHash
    } else {
      updateItem(lineId, { quantity: newQuantity });
    }
  };

  function handleCashPayment(): void {
    setShowPaymentOptions(!showPaymentOptions);
  }

  if (isRestaurantLoading || isTablesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">
          Loading restaurant data...
        </p>
      </div>
    );
  }

  // If both services are disabled, show a message
  const renderServiceUnavailable = () => {
    if (!restaurantData?.hasDineIn && !restaurantData?.hasPickup) {
      return (
        <div className="flex-1 p-6">
          <Card className="text-center max-w-md mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-2">Service Unavailable</h2>
              <p className="text-muted-foreground">
                Both dine-in and pickup services are currently unavailable.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    return null;
  };

  const mainContent = (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-12 w-12 rounded-full"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={restaurantData?.logo} alt="Profile" />
                    <AvatarFallback className="bg-transparent text-primary-foreground">
                      <img src={"/placeholder.svg"} alt="Logo" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {auth.user?.firstName + " " + auth.user?.lastName}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    auth.signOut();
                    navigate({ to: "/" });
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {restaurantData?.name}
              </h1>
              <p className="text-sm text-slate-600">Restaurant Management</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      {renderServiceUnavailable() || (
        <div className="flex-1 p-6">
          <Tabs value={defaultTabValue} onValueChange={setDefaultTabValue} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger 
                value="dine-in" 
                className="text-base"
                disabled={!restaurantData?.hasDineIn}
              >
                <Users className="w-4 h-4 mr-2" />
                Dine-in
                {!restaurantData?.hasDineIn && (
                  <span className="ml-1 text-xs opacity-60">(Unavailable)</span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="pickup" 
                className="text-base"
                disabled={!restaurantData?.hasPickup}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Pickup
                {!restaurantData?.hasPickup && (
                  <span className="ml-1 text-xs opacity-60">(Unavailable)</span>
                )}
              </TabsTrigger>
            </TabsList>

            {restaurantData?.hasDineIn && (
              <TabsContent value="dine-in" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {tables?.data.map((table) => (
                    <Card
                      key={table.id}
                      className={`
                        cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg
                        ${getTableVariant(table.status)}
                        ${
                        selectedTable?.id === table.id
                          ? "ring-2 ring-primary ring-offset-2"
                          : ""
                      }
                      `}
                      onClick={() => handleTableClick(table)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="space-y-3">
                          <h3 className="text-xl font-semibold">{table.name}</h3>
                          {getStatusBadge(table.status)}
                          {table.status !== "occupied" && (
                            <p className="text-sm opacity-90">
                              {table.status === "free" && "Available"}
                              {table.status !== "free" && "Reserved"}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}

            {restaurantData?.hasPickup && (
              <TabsContent value="pickup" className="space-y-6">
                <div className="max-w-md mx-auto">
                  <Card className="text-center">
                    <CardContent className="p-8">
                      <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-primary" />
                      <h2 className="text-2xl font-bold mb-2">Pickup Order</h2>
                      <p className="text-muted-foreground mb-6">
                        Start a new pickup order and go straight to the menu.
                      </p>
                      <Button
                        onClick={handlePickupOrder}
                        size="lg"
                        className="w-full"
                      >
                        Start Pickup Order
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </>
  );

  const sidebarContent = selectedTable
    ? (
      <>
        {/* Table Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">{selectedTable.name}</h2>
            {getStatusBadge(selectedTable.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedTable.status === "occupied" &&
              "Currently serving customers"}
            {selectedTable.status === "reserved" &&
              "Reserved for upcoming guests"}
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Clear button */}
            {selectedTable.status === "occupied" && (
              (cart?.items?.length ?? 0) > 0
                ? (
                  <Button
                    variant="outline"
                    className="mb-4 w-full"
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to clear this table?")
                      ) {
                        clearCartMutation.mutate(
                          selectedTable.id,
                        );
                      }
                    }}
                  >
                    Clear Table
                  </Button>
                )
                : null
            )}

            {/* Cart Items */}
            {showPaymentOptions
              ? (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowPaymentOptions(false)}
                    className="w-full justify-start"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to table details
                  </Button>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Payment Options</h3>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 bg-transparent"
                      onClick={() => alert("Card payment not implemented yet")}
                    >
                      <CreditCard className="mr-3 h-5 w-5" />
                      Card Payment
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 bg-transparent"
                      onClick={() => handleCashPayment()}
                    >
                      <Banknote className="mr-3 h-5 w-5" />
                      Cash Payment
                    </Button>
                  </div>
                </div>
              )
              : (
                <div className="space-y-6">
                  {/* Reservation Details */}
                  {cart?.items?.map((cartItem) => (
                    <Card
                      key={cartItem.optionsHash}
                      className="border-slate-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">
                            {cartItem.menuItem?.name ?? "Item"}
                          </h4>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(cartItem.optionsHash)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-bold text-primary">
                            £{Number(cartItem.totalPrice).toFixed(2)}
                          </span>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateCartItemQuantity(
                                  cartItem.optionsHash,
                                  cartItem.quantity - 1,
                                )}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <span className="w-8 text-center">
                              {cartItem.quantity}
                            </span>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateCartItemQuantity(
                                  cartItem.optionsHash,
                                  cartItem.quantity + 1,
                                )}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6">
          {!showPaymentOptions && (
            <div className="space-y-3">
              <Button
                onClick={() => handleOrderForTable(selectedTable.id)}
                className="w-full"
                size="lg"
              >
                {selectedTable.status === "occupied"
                  ? "Add More Items"
                  : "Start Order"}
              </Button>
              {(selectedTable.status === "occupied" ||
                selectedTable.status === "reserved") && (
                <Button
                  onClick={() => setShowPaymentOptions(true)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Process Payment
                </Button>
              )}
            </div>
          )}
        </div>
      </>
    )
    : (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-medium mb-2">Select a Table</h3>
          <p className="text-sm">
            Choose a table to view details and manage orders
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <ResizableLayout sidebar={sidebarContent}>{mainContent}</ResizableLayout>
    </div>
  );
}