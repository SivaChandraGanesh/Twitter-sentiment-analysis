"use client";

interface HeaderProps {
  title: string;
  breadcrumbs?: string[];
  subtitle?: string;
}

export default function Header({ title, breadcrumbs, subtitle }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <p className="text-xs text-gray-500">
          {breadcrumbs.join(" / ")}
        </p>
      )}
      <h1 className="mt-1 text-xl font-semibold text-gray-900">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      )}
    </header>
  );
}
