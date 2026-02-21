"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/data-input", label: "Upload", icon: "☁️" },
  { href: "/preprocessing", label: "Preprocessing", icon: "🔧" },
  { href: "/sentiment", label: "Sentiment", icon: "💬" },
  { href: "/emotion", label: "Emotion Detection", icon: "😊" },
  { href: "/dashboard", label: "Visualizations", icon: "📈" },
  { href: "/reports", label: "Reports", icon: "📄" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 flex-col justify-center border-b border-gray-200 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white">
            <span className="text-sm font-bold">M</span>
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900">Data Driven Emotion</span>
            <p className="text-xs text-gray-500">ANALYTICS DASHBOARD</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <button className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <span className="flex items-center justify-center gap-2">
            <span>+</span> New Upload
          </span>
        </button>
        <div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600">
          <div className="h-8 w-8 rounded-full bg-gray-200"></div>
          <div>
            <p className="font-medium text-gray-900">Analyst</p>
            <p className="text-xs text-gray-500">Election Analytics</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
