"use client";

import { useState } from "react";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError("Incorrect email or password");
        triggerShake();
        setLoading(false);
        return;
      }

      window.location.href = "/goals";
    } catch {
      setError("Something went wrong");
      triggerShake();
      setLoading(false);
    }
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-400">
      <div className="flex w-full max-w-6xl items-center justify-between gap-12">

        <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-[32px] p-12 w-full max-w-md">
          <h1 className="text-3xl font-bold text-black mb-8 text-center">TASKFLOW AI</h1>

          <form
            onSubmit={handleLogin}
            className={`space-y-6 transition-all ${shake ? "animate-shake" : ""}`}
          >
            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                placeholder="Enter your email"
                className="w-full bg-gray-100 text-gray-800 border border-gray-300 rounded-lg px-3 py-2 
                focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-200 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full bg-gray-100 text-gray-800 border border-gray-300 rounded-lg px-3 py-2 pr-10
                  focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-200 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <p className="text-red-500 text-sm text-center animate-fade">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 hover:scale-[1.01] transition font-medium"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* <p className="text-sm text-gray-600 mt-4 text-center">
            Forgot password?{" "}
            <span className="text-blue-600 hover:underline cursor-pointer">Click here</span>
          </p> */}

          <p className="text-sm text-gray-600 mt-2 text-center">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center">
          <img
            src="/login-illustration.jpg"
            alt="Login Illustration"
            className="w-full max-w-lg drop-shadow-2xl rounded-4xl bg-transparent"
          />
        </div>
      </div>

      {/* Animations */}
      <style>{`
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }

        .animate-fade {
          animation: fadeIn 0.25s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}