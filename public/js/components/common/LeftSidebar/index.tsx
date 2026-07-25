// @ts-nocheck
import React from "react";
import { Link, useLocation } from "react-router-dom";

const items = [
  { label: "Home", path: "/" },
  { label: "Trending", path: "/trending" },
  { label: "Subscriptions", path: "/subscriptions" },
  { label: "Library", path: "/library" },
  { label: "History", path: "/history" },
];

const LeftSidebar = () => {
  const loc = useLocation();

  return (
    <nav className="hidden lg:flex flex-col w-64 shrink-0 border-r border-gray-200 bg-white p-4 text-gray-900   ">
      <div className="mb-4 text-lg font-semibold text-gray-900 ">Finguard</div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.path}>
            <Link
              to={it.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 :bg-gray-800 ${loc.pathname === it.path ? "bg-primary/10 text-primary font-medium" : "text-gray-700 "}`}
            >
              <span className="w-6 h-6 bg-gray-200  rounded-sm inline-block" />
              <span className="text-sm">{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500  ">
        <div className="mb-2">Explore</div>
        <ul className="space-y-1">
          <li className="px-3 py-2 hover:bg-gray-100 :bg-gray-800 rounded-md cursor-pointer">Music</li>
          <li className="px-3 py-2 hover:bg-gray-100 :bg-gray-800 rounded-md cursor-pointer">News</li>
          <li className="px-3 py-2 hover:bg-gray-100 :bg-gray-800 rounded-md cursor-pointer">Sports</li>
        </ul>
      </div>
    </nav>
  );
};

export default LeftSidebar;
