"use client";

import { useEffect, useState } from "react";

import TawilaShimmer from "@/components/LoadingBranded";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/core/repositories/auth-repository";
import { FoundationCard } from "./components/FoundationCard";
import type { Delegation } from "./dtos/dtos";
import { useFoundationStore } from "./store/foundation-store";

// Clear all authentication and foundation data
// function clearAllAuthData() {
//   console.log('🧹 clearAllAuthData called in FoundationsPage at:', new Date().toISOString());
//   console.trace('🧹 clearAllAuthData stack trace:');

//   // Clear localStorage
//   localStorage.removeItem("UserData");
//   localStorage.removeItem("accessToken");
//   localStorage.removeItem("refreshToken");
//   localStorage.removeItem("x-foundation-id");

//   // Clear Zustand stores
//   useFoundationStore.getState().clearSelectedFoundation();

//   // Clear other potential auth-related items
//   const keysToRemove = [];
//   for (let i = 0; i < localStorage.length; i++) {
//     const key = localStorage.key(i);
//     if (key && (key.includes('auth') || key.includes('foundation') || key.includes('token'))) {
//       keysToRemove.push(key);
//     }
//   }
//   console.log('🧹 Removing additional auth keys:', keysToRemove);
//   keysToRemove.forEach(key => localStorage.removeItem(key));

//   console.log('🧹 clearAllAuthData completed');
// }



export default function DelegationsPage() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, signOut } = useAuthStore();
  const userId = user?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSelectedFoundation = useFoundationStore(state => state.setSelectedFoundation);

  function handleSelectRestaurant(foundation: Delegation) {
    console.log("Setting foundation ID:", foundation._id);
    console.log("Full foundation object:", foundation);

    queryClient.clear();

    setSelectedFoundation(foundation);

    navigate({
      to: "/tables",
    });
  }

  useEffect(() => {
    const fetchDelegations = async () => {
      try {
        if (!userId) {
          console.log('🚨 No userId in FoundationsPage - user not authenticated');
          setError("User not authenticated. Please sign in again.");
          // Let the auth system handle logout properly
          console.log('🚨 Calling signOut() from FoundationsPage');
          signOut();
          setTimeout(() => {
            navigate({ to: "/", replace: true });
          }, 1000);
          setLoading(false);
          return;
        }

        const response = await authApi.getUserDelegations(userId);
        setDelegations(response.data);

        // Auto-redirect logic:
        // If user has exactly one delegation, redirect to it regardless of existing selection
        // If user has multiple delegations but an existing selection, verify it's still valid
        const existingFoundationId = localStorage.getItem("x-foundation-id");

        if (response.data.length === 1) {
          // Single delegation - always redirect to it
          handleSelectRestaurant(response.data[0]);
        } else if (response.data.length > 1 && existingFoundationId) {
          // Multiple delegations with existing selection - verify selection is still valid
          const validDelegation = response.data.find(
            delegation => delegation.foundation._id === existingFoundationId
          );

          if (validDelegation) {
            // Existing selection is valid, redirect to tables
            handleSelectRestaurant(validDelegation);
          }
          // If not valid, show the selection page (current behavior)
        }
      } catch (err: any) {
        console.error("Failed to load delegations:", err);

        // Handle authentication errors specifically
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setError("Your session has expired. Please sign in again.");
          // Don't auto-logout here - let the axios interceptor handle token expiration
          // The token expiration dialog will be shown automatically
          // Just show an error message to the user
        } else {
          setError("Failed to load delegations. Please check your internet connection and try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDelegations();
  }, [userId, signOut, navigate]);

  if (loading) return <TawilaShimmer />;

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

  if (delegations.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Your Delegations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your connected restaurants
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No restaurant delegations found. Please contact your administrator to get access to a restaurant.
          </p>
        </div>
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

