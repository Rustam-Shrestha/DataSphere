// @ts-nocheck
import React from "react";
import CustomFileUpload from "../CustomFileUpload";
import UserProfile from "../../user";

const RightSidebar = ({ onFileUpload, quickLinks = [] }) => {
  return (
    <aside className="hidden lg:flex lg:flex-col w-80 shrink-0 pl-6">
      <div className="bg-white  border border-gray-100  rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">Profile</h4>
        </div>
        <UserProfile />
      </div>

      <div className="bg-white  border border-gray-100  rounded-lg p-4 mb-4 shadow-sm">
        <h4 className="text-sm font-semibold mb-3">Upload</h4>
        <CustomFileUpload onFileUpload={onFileUpload} />
      </div>

      <div className="bg-white  border border-gray-100  rounded-lg p-4 shadow-sm">
        <h4 className="text-sm font-semibold mb-3">Quick Links</h4>
        <ul className="text-sm space-y-2">
          {quickLinks.length === 0 ? (
            <li className="text-gray-500">No quick links</li>
          ) : (
            quickLinks.map((l, i) => (
              <li key={i} className="hover:text-primary cursor-pointer" onClick={l.onClick}>
                {l.label}
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
};

export default RightSidebar;
