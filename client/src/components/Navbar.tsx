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
  CodeIcon,
} from "@assets/icons";

const navLinks = [
  { to: "/", label: "Upload", icon: <CloudUpload className="size-4 shrink-0" /> },
  { to: "/data", label: "Records", icon: <TableIcon className="size-4 shrink-0" /> },
  { to: "/chat", label: "Chat Assistant", icon: <MessageSquareText className="size-4 shrink-0" /> },
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4 shrink-0" /> },
  { to: "/sql", label: "SQL Studio", icon: <CodeIcon className="size-4 shrink-0" /> },
];

export function Navbar() {
  const { token, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white text-slate-900 shadow-subtle">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <NavLink
          to="/"
          className="flex items-center gap-3 font-semibold text-base tracking-tight hover:opacity-90 transition"
        >
          <div className="p-2 rounded-md bg-[#DCFCE7] text-[#15803D] border border-emerald-200 shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight text-slate-900 tracking-tight">
              DataSphere
            </span>
            <span className="text-[11px] font-mono tracking-wider uppercase text-slate-500 font-medium leading-none">
              Compliance Manager
            </span>
          </div>
        </NavLink>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-md border border-slate-200/60">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-[#DCFCE7] text-[#166534] font-medium shadow-subtle"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80 font-normal"
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User state / Auth Actions */}
        <div className="flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200">
                <UserCircle2 className="size-4 text-[#15803D]" />
                <span className="font-medium">Active Session</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="size-3.5 text-slate-500" />}
              >
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
