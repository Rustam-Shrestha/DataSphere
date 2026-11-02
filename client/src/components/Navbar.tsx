import { NavLink } from "react-router-dom";
import { useAuthStore } from "../lib/store";
import { Button } from "./ui";
import {
  ShieldCheck,
  CloudUpload,
  Table as TableIcon,
  MessageSquareText,
  LayoutDashboard,
  LogOut,
  UserCircle2,
} from "@assets/icons";

const navLinks = [
  { to: "/", label: "Upload", icon: <CloudUpload className="size-4 shrink-0" /> },
  { to: "/data", label: "Records", icon: <TableIcon className="size-4 shrink-0" /> },
  { to: "/chat", label: "Chat Assistant", icon: <MessageSquareText className="size-4 shrink-0" /> },
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4 shrink-0" /> },
];

export function Navbar() {
  const { token, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0F172A] text-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2.5 font-bold text-base tracking-tight hover:opacity-95 transition">
          <div className="p-1.5 rounded-lg bg-[#166534] text-white shadow-2xs border border-emerald-500/30">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-sm sm:text-base font-extrabold leading-tight text-white tracking-tight">
              DataSphere
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-semibold leading-none">
              Compliance Manager
            </span>
          </div>
        </NavLink>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#166534] text-white shadow-xs font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User state / Auth Actions */}
        <div className="flex items-center gap-2.5">
          {token ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
                <UserCircle2 className="size-4 text-emerald-400" />
                <span className="font-medium">Active Session</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="size-4 text-slate-300" />}
                className="text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/70"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Guest Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-900/90 py-2 px-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 rounded-md text-[11px] font-medium transition ${
                isActive ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </header>
  );
}
