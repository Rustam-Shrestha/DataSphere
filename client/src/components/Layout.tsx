import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#111827]">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200/80 bg-white/50 py-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} DataSphere Compliance Manager. Environmental Records Tracking.</p>
          <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
            <span>STATION MONITOR v1.0</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">ALL SYSTEMS SECURE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
