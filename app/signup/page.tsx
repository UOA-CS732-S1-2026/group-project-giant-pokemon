"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // PASSWORD STRENGTH CHECK
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

  // VALIDATION ON SUBMIT ONLY
  const validateForm = () => {
    const newErrors: any = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain an uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Password must contain a lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain a number";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = "Password must contain a special character";
    }

    // Confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    // Trigger shake animation if errors exist
    if (Object.keys(newErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    return Object.keys(newErrors).length === 0;
  };

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) return;

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

      window.location.href = "/login";
    } catch {
      setServerError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-400">
      <div className="flex w-full max-w-6xl items-center justify-between gap-12">

        <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-[32px] p-12 w-full max-w-md">
          <h1 className="text-3xl font-bold text-black mb-8 text-center">TASKFLOW AI</h1>

          <form
            onSubmit={handleSignup}
            noValidate
            className={`space-y-6 transition-all ${shake ? "animate-shake" : ""}`}
          >

            {/* NAME */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full bg-gray-100 text-gray-800 border border-gray-300 rounded-lg px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                placeholder="Enter your email"
                className={`w-full bg-gray-100 text-gray-800 border rounded-lg px-3 py-2 
                  ${errors.email ? "border-red-500 bg-red-100" : "border-gray-300"}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 animate-fade">{errors.email}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`w-full bg-gray-100 text-gray-800 border rounded-lg px-3 py-2 pr-10
                    ${errors.password ? "border-red-500 bg-red-100" : "border-gray-300"}`}
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

              {/* Strength Meter */}
              {password && !errors.password && (
                <p className={`text-sm mt-1 ${
                    getPasswordStrength() === "Weak"
                    ? "text-red-500"
                    : getPasswordStrength() === "Medium"
                    ? "text-yellow-500"
                    : "text-green-600"
                }`}>
                    Strength: {getPasswordStrength()}
                </p>
               )}

              {errors.password && (
                <p className="text-red-500 text-sm mt-1 animate-fade">{errors.password}</p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  className={`w-full bg-gray-100 text-gray-800 border rounded-lg px-3 py-2 pr-10
                    ${errors.confirmPassword ? "border-red-500 bg-red-100" : "border-gray-300"}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 animate-fade">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-red-500 text-sm text-center animate-fade">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-4 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center">
          <img
            src="/signup-illustration.jpg"
            alt="Signup Illustration"
            className="w-full max-w-lg drop-shadow-2xl rounded-4xl bg-transparent"
          />
        </div>
      </div>

      {/* Tailwind Animations */}
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