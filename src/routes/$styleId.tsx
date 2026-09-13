import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$styleId")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
