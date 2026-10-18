import { createFileRoute } from "@tanstack/react-router";
import { VellumApp } from "@/components/vellum/app";

export const Route = createFileRoute("/")({ component: VellumApp });
