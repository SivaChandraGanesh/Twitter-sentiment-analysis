"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  breadcrumbs?: string[];
  subtitle?: string;
}

export default function Header({ title, breadcrumbs, subtitle }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, clear auth tokens/session here
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <p className="text-xs text-gray-500">{breadcrumbs.join(" / ")}</p>
          )}
          <h1 className="mt-1 text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
          >
            <span className="text-xl">👤</span>
          </button>

          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsProfileOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl z-20">
                <div className="px-4 py-2 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-900">User Profile</p>
                  <p className="text-xs text-gray-500">user@example.com</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <span className="mr-2">🚪</span> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
