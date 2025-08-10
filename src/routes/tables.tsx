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
import { useAuth } from "@/core/hooks/use-auth";
import { useGetRestaurantById } from "@/core/hooks/use-restaurant-hooks";
import { useGetTables } from "@/core/hooks/use-tables-hooks";
import type { Table } from "@/core/models/TableModel";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Banknote,
  Clock,
  CreditCard,
  ShoppingBag,
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
    data: tables,
    isLoading: isTablesLoading,
  } = useGetTables();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const {
    data: restaurant,
    isLoading: isRestaurantLoading,
  } = useGetRestaurantById();

  useEffect(() => {
    if (restaurant?.data) {
      localStorage.setItem("x-foundation-id", restaurant.data.id);
      console.log("x-foundation-id", localStorage.getItem("x-foundation-id"));
      console.log("x-foundation-id before", restaurant.data.id);
    }
  }, [restaurant?.data]);

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
  if (table.status === "free") {  // Changed from "empty" to "free"
    localStorage.setItem("selectedTable", table.id.toString());
    navigate({
      to: "/menu",
    });
  } else {
    setSelectedTable(table);
    setShowPaymentOptions(false);
  }
};

  const handleOrderForTable = (tableId: number) => {
    localStorage.setItem("selectedTable", tableId.toString());
    navigate({
      to: "/menu",
    });
  };

  console.log(handleOrderForTable);

  const handlePickupOrder = () => {
    localStorage.setItem("orderType", "pickup");
    localStorage.removeItem("selectedTable");
    navigate({
      to: "/menu",
    });
  };

  if (isRestaurantLoading || isTablesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">
          Loading restaurant data...
        </p>
      </div>
    );
  }

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
                    <AvatarImage src="/placeholder.svg" alt="Profile" />
                    <AvatarFallback className="bg-transparent text-primary-foreground">
                      <img src={restaurant?.data.logo} alt="Logo" />
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
                {
                  /* <DropdownMenuItem onClick={() => navigate({ to: "/menu" })}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem> */
                }
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
                {restaurant?.data.name}
              </h1>
              <p className="text-sm text-slate-600">Restaurant Management</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6">
        <Tabs defaultValue="dine-in" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="dine-in" className="text-base">
              <Users className="w-4 h-4 mr-2" />
              Dine-in
            </TabsTrigger>
            <TabsTrigger value="pickup" className="text-base">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Pickup
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
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
                    >
                      <CreditCard className="mr-3 h-5 w-5" />
                      Card Payment
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 bg-transparent"
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
                  {selectedTable.status !== "free" && (
                    <div>
                      <h3 className="font-semibold mb-4">
                        Reservation Details
                      </h3>
                      <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-amber-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6">
          {!showPaymentOptions && (
            <div className="space-y-3">
              {
                /* <Button onClick={() => handleOrderForTable(selectedTable.id)} className="w-full" size="lg">
              {selectedTable.status === "occupied" ? "Add More Items" : "Start Order"}
            </Button> */
              }
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
