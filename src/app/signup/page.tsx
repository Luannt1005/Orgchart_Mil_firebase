"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "./signup.css";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!fullName || !username || !password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu không trùng khớp");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.replace("/login");
        }, 2000);
      } else {
        setError(data.message || "Tên đăng nhập đã tồn tại");
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
      <div className="signup-container">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Tạo tài khoản thành công!</h2>
          <p>Chuyển hướng đến trang đăng nhập...</p>
          <div className="spinner-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Background Elements */}
        <div className="bg-decoration bg-1"></div>
        <div className="bg-decoration bg-2"></div>
      </div>
    );
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        {/* Logo */}
        <div className="signup-logo">
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
        <div className="signup-header">
          <h1>Tạo Tài Khoản</h1>
          <p>Quản lý Sơ đồ Tổ chức</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="signup-form">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">Họ và tên</label>
            <div className="input-wrapper">
              <input
                id="fullName"
                type="text"
                placeholder="Nhập họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="form-input"
                required
              />
              <span className="input-icon">👤</span>
            </div>
          </div>

          {/* Username */}
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

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="form-input"
                required
              />
              <span className="input-icon">🔒</span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="form-input"
                required
              />
              <span className="input-icon">🔒</span>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="signup-button">
            {loading ? (
              <>
                <span className="button-spinner"></span>
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <span>Tạo Tài Khoản</span>
                <span className="button-arrow">→</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider-line"></div>

        {/* Footer Links */}
        <div className="signup-footer">
          <span className="footer-text">Đã có tài khoản?</span>
          <Link href="/login" className="footer-link">
            Đăng nhập
          </Link>
        </div>
      </div>

      {/* Background Elements */}
      <div className="bg-decoration bg-1"></div>
      <div className="bg-decoration bg-2"></div>
    </div>
  );
}
