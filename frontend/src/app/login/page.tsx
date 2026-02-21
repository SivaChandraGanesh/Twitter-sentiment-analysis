"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would handle authentication here.
    localStorage.setItem("isLoggedIn", "true");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Hero Section */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white bg-opacity-10 backdrop-blur-sm">
              <span className="text-2xl font-bold">📊</span>
            </div>
            <span className="text-xl font-bold tracking-tight">RedditAlytics</span>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="mb-6 text-6xl font-bold leading-tight">
            Analyze. <br />
            Inform. <br />
            Empower.
          </h1>
          <p className="text-lg text-slate-300">
            The most advanced project analysis platform powered by sentiment engine.
            Identify trends and emotions before they become mainstream.
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">
            © 2026 RedditAlytics Analytics. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Login Portal */}
      <div className="flex w-full items-center justify-center bg-gray-50 p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white p-10 shadow-xl shadow-gray-200/50 outline outline-1 outline-gray-100">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-gray-900">RedditAlytics Portal</h2>
              <p className="mt-2 text-gray-500">Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                Sign In
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                Don&apos;t have an account?{" "}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Contact admin
                </a>
              </p>
            </div>
          </div>

          <div className="mt-12 text-center text-xs text-gray-400">
            <p>Support: support@redditalytics.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
