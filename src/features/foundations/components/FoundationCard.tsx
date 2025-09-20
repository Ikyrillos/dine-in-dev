// FoundationCard.tsx - Updated to use Zustand store
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Delegation } from "../dtos/dtos";
import { useFoundationStore } from "../store/foundation-store";

export function FoundationCard({ delegation }: { delegation: Delegation }) {
  const foundation = delegation;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSelectedFoundation = useFoundationStore(state => state.setSelectedFoundation);

  function handleSelectRestaurant() {
    console.log("Setting foundation ID:", foundation._id);
    console.log("Full foundation object:", foundation);
    
    queryClient.clear();
    
    // Use Zustand store instead of localStorage
    setSelectedFoundation(foundation);
    
    navigate({
      to: "/tables",
    });
  }

  return (
    <Card
      className="overflow-hidden shadow-md transition-transform py-6 hover:scale-[1.02] cursor-pointer"
      onClick={handleSelectRestaurant}
    >
      <div className="h-40 w-full">
        <img
          src={foundation?.foundation.cover || "/logo-placeholder.png"}
          alt={foundation?.foundation.name}
          className="object-contain w-full h-40"
        />
      </div>
      <CardHeader className="flex flex-row items-center gap-4">
        <img
          src={foundation.foundation.logo || "/logo-placeholder.png"}
          alt={`${foundation.foundation.name} Logo`}
          width={40}
          height={40}
          className="rounded-full border object-cover"
        />
        <div>
          <CardTitle className="text-lg">{foundation.foundation.name}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {foundation.foundation.address}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          className="w-full cursor-pointer"
          onClick={handleSelectRestaurant}
        >
          Select Foundation <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}