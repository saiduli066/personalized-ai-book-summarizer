import { redirect } from "next/navigation";

export default function HomePage() {
  // This page handles the root "/" route
  // Middleware will redirect here before page loads:
  // - Logged in users → /dashboard
  // - Not logged in users → /landing

  redirect("/landing");
}
