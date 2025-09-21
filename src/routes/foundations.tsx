import DelegationsPage from "@/features/foundations/FoundationsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/foundations")({
  component: DelegationsPage,
  // beforeLoad: async () => {
  //   // Only redirect if user is authenticated and foundation ID exists
  //   const accessToken = localStorage.getItem("accessToken");
  //   if (accessToken) {
  //     const foundationId = localStorage.getItem("x-foundation-id");
  //     if (foundationId) {
  //       throw redirect({
  //         to: "/tables",
  //         replace: true,
  //       });
  //     }
  //   } else {
  //     throw redirect({
  //       to: "/",
  //       replace: true,
  //     });
  //   }
  // },
});
