import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-accent text-accent-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="font-display text-lg font-bold mb-2">🧋 Sip & Tambay</p>
          <p className="text-sm opacity-70">Freshly brewed happiness in every sip</p>
          <p className="text-xs opacity-50 mt-4">© 2026 Sip & Tambay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
