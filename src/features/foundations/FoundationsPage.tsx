"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

import { useAuth } from "@/core/hooks/use-auth";
import { authApi } from "@/core/repositories/auth-repository";
import { FoundationCard } from "./components/FoundationCard";
import type { Delegation } from "./dtos/dtos";



export default function DelegationsPage() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log("delegations", delegations);
  const auth = useAuth();
  const userId = auth.user?.id;

  useEffect(() => {
    const fetchDelegations = async () => {
      try {
        if (!userId) return;
        const response = await authApi.getUserDelegations(userId);
        setDelegations(response.data);
      } catch (err) {
        setError("Failed to load delegations. Please try again later." + err);
      } finally {
        setLoading(false);
      }
    };

    fetchDelegations();
  }, [userId]);

  if (loading) return <DelegationsLoadingSkeleton />;

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Your Delegations</h1>
        <p className="text-muted-foreground mt-1">
          Manage your connected restaurants
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {delegations.map((delegation) => (
          <FoundationCard key={delegation._id} delegation={delegation} />
        ))}
      </div>
    </div>
  );
}

function DelegationsLoadingSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton className="h-40 w-full" />
            <CardHeader className="flex gap-4 items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
