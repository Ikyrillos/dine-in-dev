import DelegationsPage from "@/features/foundations/FoundationsPage";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/foundations")({
  component: DelegationsPage,
  beforeLoad: async ({ context }:{ context: any}) => {
    // Only redirect if user is authenticated and foundation ID exists
    if (context.auth.isAuthenticated) {
      const foundationId = localStorage.getItem("x-foundation-id");
      if (foundationId) {
        throw redirect({
          to: "/tables",
          replace: true,
        });
      }
    }

    return null;
  },
})