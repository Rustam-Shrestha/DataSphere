import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans">
      <Navbar />
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-normal text-slate-600">
            © {new Date().getFullYear()} DataSphere Compliance Manager. Environmental Records Tracking.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            <span>STATION MONITOR v1.0</span>
            <span>•</span>
            <span className="text-[#15803D] font-medium">ALL SYSTEMS VERIFIED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
