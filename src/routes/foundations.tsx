import DelegationsPage from "@/features/foundations/FoundationsPage";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/foundations")({
  component: DelegationsPage,
  beforeLoad: async () => {
    // if foundation is selected, redirect to /tables
    const foundationId = localStorage.getItem("x-foundation-id");
    if (foundationId) {
      throw redirect({
        to: "/tables",
        replace: true,
      });
    }
  },
})