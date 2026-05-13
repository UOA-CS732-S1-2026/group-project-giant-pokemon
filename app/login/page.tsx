"use client";

import { useState, FormEvent } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { AppBackdrop } from "@/components/ui/foundation";

type SignupErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup-only fields
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Signup validation errors
  const [errors, setErrors] = useState<SignupErrors>({});

  // Password strength
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return "Weak";
    if (score === 3) return "Medium";
    return "Strong";
  };

  // Signup validation
  const validateSignup = () => {
    const newErrors: SignupErrors = {};

    // NAME
    if (!name.trim()) {
        newErrors.name = "Name is required";
    }

    // EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email";
    }

    // PASSWORD
    if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
        newErrors.password = "Must contain an uppercase letter";
    } else if (!/[a-z]/.test(password)) {
        newErrors.password = "Must contain a lowercase letter";
    } else if (!/[0-9]/.test(password)) {
        newErrors.password = "Must contain a number";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
        newErrors.password = "Must contain a special character";
    }

    // CONFIRM PASSWORD
    if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return false;
    }

    return true;
  };

  // LOGIN SUBMIT
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      window.location.href = "/profile";
    } catch {
      setServerError("Something went wrong");
      setLoading(false);
    }
  }

  // SIGNUP SUBMIT
  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setServerError("");

    if (!validateSignup()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || "Signup failed");
        setLoading(false);
        return;
      }

      setTab("login");
      setLoading(false);
    } catch {
      setServerError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <AppBackdrop className="flex items-center justify-center px-6 py-10">

      {/* BLUE GLOW */}
      <div className="absolute top-[20%] left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[180px]"></div>

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-white/10 bg-slate-950/65 p-8 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">

        <h1 className="text-3xl font-bold text-center text-white mb-1">
          Taskflow
        </h1>

        <p className="mb-8 text-center text-sm text-blue-200">
          AI scheduling console
        </p>

        {/* TABS */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-md border py-2 font-medium transition ${
              tab === "login"
                ? "border-blue-300/30 bg-blue-500/20 text-white"
                : "border-white/10 bg-white/5 text-gray-300"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setTab("signup")}
            className={`flex-1 rounded-md border py-2 font-medium transition ${
              tab === "signup"
                ? "border-blue-300/30 bg-blue-500/20 text-white"
                : "border-white/10 bg-white/5 text-gray-300"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* LOGIN FORM */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-6">

            <div>
              <label className="text-sm font-medium text-gray-200">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="mt-1 w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-white outline-none focus:border-blue-300/60 focus:ring-2 focus:ring-blue-500/25"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="mt-1 w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 pr-10 text-white outline-none focus:border-blue-300/60 focus:ring-2 focus:ring-blue-500/25"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {serverError && <p className="text-red-400 text-sm text-center">{serverError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md border border-blue-300/30 bg-blue-500/20 py-2 font-medium text-blue-50 transition hover:border-blue-200/60 hover:bg-blue-500/30 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* SIGNUP FORM */}
        {tab === "signup" && (
          <form onSubmit={handleSignup} className={`space-y-6 ${shake ? "animate-shake" : ""}`}>

            <div>
              <label className="text-sm font-medium text-gray-200">Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className={`mt-1 w-full rounded-md border bg-slate-900/70 px-3 py-2 text-white outline-none focus:border-blue-300/60 focus:ring-2 focus:ring-blue-500/25 ${
                  errors.name ? "border-red-500 bg-red-900/30" : "border-white/10"
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200">Email</label>
              <input
                type="text"
                placeholder="Enter your email"
                className={`mt-1 w-full rounded-md border bg-slate-900/70 px-3 py-2 text-white outline-none focus:border-blue-300/60 focus:ring-2 focus:ring-blue-500/25 ${
                  errors.email ? "border-red-500 bg-red-900/30" : "border-blue-500/30"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`mt-1 w-full rounded-md border bg-slate-900/70 px-3 py-2 pr-10 text-white outline-none focus:border-blue-300/60 focus:ring-2 focus:ring-blue-500/25 ${
                    errors.password ? "border-red-500 bg-red-900/30" : "border-white/10"
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              {password && !errors.password && (
                <p
                  className={`text-sm mt-1 ${
                    getPasswordStrength() === "Weak"
                      ? "text-red-400"
                      : getPasswordStrength() === "Medium"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  Strength: {getPasswordStrength()}
                </p>
              )}

              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={`mt-1 w-full rounded-md border bg-slate-900/70 px-3 py-2 pr-10 text-white outline-none focus:border-blue-300/60 focus:ring-2 focus:ring-blue-500/25 ${
                    errors.confirmPassword ? "border-red-500 bg-red-900/30" : "border-white/10"
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {serverError && <p className="text-red-400 text-sm text-center">{serverError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md border border-blue-300/30 bg-blue-500/20 py-2 font-medium text-blue-50 transition hover:border-blue-200/60 hover:bg-blue-500/30 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}
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
      `}</style>
    </AppBackdrop>
  );
}
