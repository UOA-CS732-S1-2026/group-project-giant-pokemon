"use client";

import { useState, FormEvent } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

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
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

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
    const newErrors: typeof errors = {
      email: "",
      password: "",
      confirmPassword: "",
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) newErrors.email = "Please enter a valid email";

    if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(password)) newErrors.password = "Must contain an uppercase letter";
    else if (!/[a-z]/.test(password)) newErrors.password = "Must contain a lowercase letter";
    else if (!/[0-9]/.test(password)) newErrors.password = "Must contain a number";
    else if (!/[^A-Za-z0-9]/.test(password)) newErrors.password = "Must contain a special character";

    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    return Object.keys(newErrors).length === 0;
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
    <div className="min-h-screen flex items-center justify-center bg-[#050b24] relative overflow-hidden px-6">

      {/* BLUE GLOW */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-600/30 blur-[180px] rounded-full"></div>

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md rounded-3xl p-10 shadow-2xl border border-blue-500/20 bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]">

        <h1 className="text-3xl font-bold text-center text-white mb-1">
          TASKFLOW AI
        </h1>

        <p className="text-center text-gray-300 mb-8 text-sm">
          Smart Scheduling Assistant
        </p>

        {/* TABS */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-2 rounded-lg font-medium border transition ${
              tab === "login"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-[#0d1538] text-gray-300 border-blue-500/30"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setTab("signup")}
            className={`flex-1 py-2 rounded-lg font-medium border transition ${
              tab === "signup"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-[#0d1538] text-gray-300 border-blue-500/30"
            }`}
          >
            New User
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
                className="w-full bg-[#0d1538] text-white border border-blue-500/30 rounded-lg px-3 py-2 mt-1"
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
                  className="w-full bg-[#0d1538] text-white border border-blue-500/30 rounded-lg px-3 py-2 pr-10 mt-1"
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
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
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
                className="w-full bg-[#0d1538] text-white border border-blue-500/30 rounded-lg px-3 py-2 mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200">Email</label>
              <input
                type="text"
                placeholder="Enter your email"
                className={`w-full bg-[#0d1538] text-white border rounded-lg px-3 py-2 mt-1 ${
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
                  className={`w-full bg-[#0d1538] text-white border rounded-lg px-3 py-2 pr-10 mt-1 ${
                    errors.password ? "border-red-500 bg-red-900/30" : "border-blue-500/30"
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
                  placeholder="Re-enter your password"
                  className={`w-full bg-[#0d1538] text-white border rounded-lg px-3 py-2 pr-10 mt-1 ${
                    errors.confirmPassword ? "border-red-500 bg-red-900/30" : "border-blue-500/30"
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
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {loading ? "Creating account..." : "Sign Up"}
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
    </div>
  );
}
