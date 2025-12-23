"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./login.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // ✅ Show success animation
        setSuccess(true);
        
        // Set cookie for middleware
        document.cookie = "auth=true; path=/; max-age=86400";
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect after animation
        setTimeout(() => {
          router.replace("/");
        }, 2000);
      } else {
        setError(data.message || "Sai tài khoản hoặc mật khẩu");
        setLoading(false);
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="login-container">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Đăng nhập thành công!</h2>
          <p>Chào mừng quay lại</p>
          <div className="spinner-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-wrapper">
            <Image
              src="/milwaukee_logo.png"
              width={140}
              height={50}
              alt="Milwaukee Tool"
              priority
            />
          </div>
        </div>

        {/* Header */}
        <div className="login-header">
          <h1>Đăng Nhập</h1>
          <p>Quản lý Sơ đồ Tổ chức</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Username Input */}
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <div className="input-wrapper">
              <input
                id="username"
                type="text"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="form-input"
                required
              />
              <span className="input-icon">👤</span>
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="form-input"
                required
              />
              <span className="input-icon">🔒</span>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? (
              <>
                <span className="button-spinner"></span>
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <span>Đăng Nhập</span>
                <span className="button-arrow">→</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider-line"></div>

        {/* Footer Links */}
        <div className="login-footer">
          <a href="#forgot" className="footer-link">
            Quên mật khẩu?
          </a>
          <a href="/signup" className="footer-link">
            Tạo tài khoản
          </a>
        </div>
      </div>

      {/* Background Elements */}
      <div className="bg-decoration bg-1"></div>
      <div className="bg-decoration bg-2"></div>
    </div>
  );
}
