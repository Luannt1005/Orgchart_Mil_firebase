"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "./signup.css";

// Firebase imports
import { auth, db } from "@/lib/firebase";
import { signInAnonymously, signOut } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { hashPassword } from "@/lib/password"; // Client-side compatible hashing

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
      // 1. Kiểm tra cấu hình Firebase
      if (!auth || !db) {
        throw new Error("Firebase chưa được cấu hình. Vui lòng kiểm tra file .env.local và cấu hình Firebase.");
      }

      // 2. Kiểm tra xem username đã tồn tại trong Firestore chưa
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));

      // Note: Cần quyền đọc Firestore (Security Rules)
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError("Tên đăng nhập đã tồn tại");
        setLoading(false);
        return;
      }

      // 3. Hash password (client-side) để lưu trữ an toàn hơn
      const hashedPassword = await hashPassword(password);

      // 4. Sign in Anonymously để tạo UID
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // 5. Lưu thông tin user vào Firestore
      // Dùng UID làm document ID
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username,
        password: hashedPassword,
        full_name: fullName,
        role: "user",
        createdAt: new Date().toISOString()
      });

      // 6. Sign out (để user có thể login lại chính thức ở trang login)
      await signOut(auth);

      setSuccess(true);
      setTimeout(() => {
        router.replace("/login");
      }, 2000);

    } catch (err: any) {
      console.error("Signup error:", err);
      let msg = "Lỗi kết nối. Vui lòng thử lại.";

      if (err.code === 'auth/operation-not-allowed') {
        msg = "Vui lòng bật Anonymous Auth trong Firebase Console.";
      } else if (err.code === 'permission-denied') {
        msg = "Lỗi quyền truy cập: Kiểm tra Firestore Security Rules.";
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
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
