import { NavLink } from "react-router-dom";
import { useAuthStore } from "../lib/store";

const links = [
  { to: "/", label: "Upload" },
  { to: "/data", label: "Data" },
  { to: "/chat", label: "Chat" },
  { to: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const { token, logout } = useAuthStore();

  return (
    <nav className="bg-gray-900 text-white h-14 flex items-center px-6 gap-1">
      <span className="font-bold text-base mr-4">Compliance Manager</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === "/"}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-sm font-medium transition ${
              isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
      <div className="ml-auto flex items-center gap-3">
        {token ? (
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white transition">
            Logout
          </button>
        ) : (
          <span className="text-sm text-gray-500">Not logged in</span>
        )}
      </div>
    </nav>
  );
}
