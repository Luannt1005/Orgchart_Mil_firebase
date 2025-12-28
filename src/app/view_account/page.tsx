"use client";

import { useState, useEffect } from "react";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    addDoc,
    where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { hashPassword } from "@/lib/password";
import "./view_account.css";

interface UserAccount {
    id: string;
    username: string;
    full_name: string;
    role: string;
    createdAt?: any;
}

export default function ViewAccountPage() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserAccount[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // State for Modal (Add/Edit)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: "",
        full_name: "",
        password: "",
        role: "user"
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = users.filter(user =>
            user.full_name.toLowerCase().includes(lowerSearch) ||
            user.username.toLowerCase().includes(lowerSearch)
        );
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            const result = await res.json();

            if (result.success) {
                setUsers(result.data);
                setFilteredUsers(result.data);
            } else {
                setError(result.message || "Không thể tải danh sách tài khoản");
            }
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setModalMode("add");
        setFormData({
            username: "",
            full_name: "",
            password: "",
            role: "user"
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (user: UserAccount) => {
        setModalMode("edit");
        setCurrentUserId(user.id);
        setFormData({
            username: user.username,
            full_name: user.full_name,
            password: "", // Don't show password or allow editing it here for simplicity
            role: user.role || "user"
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError("");

        try {
            if (modalMode === "add") {
                // Check if username already exists
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "==", formData.username));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    setError("Tên đăng nhập đã tồn tại trong hệ thống.");
                    setIsSaving(false);
                    return;
                }

                if (formData.password.length < 6) {
                    setError("Mật khẩu phải có ít nhất 6 ký tự.");
                    setIsSaving(false);
                    return;
                }

                // Hash password
                const hashedPassword = await hashPassword(formData.password);

                // Add to Firestore
                const newUser = {
                    username: formData.username,
                    full_name: formData.full_name,
                    password: hashedPassword,
                    role: formData.role,
                    createdAt: new Date().toISOString()
                };

                const docRef = await addDoc(collection(db, "users"), newUser);

                // Update local state
                const addedUser: UserAccount = {
                    id: docRef.id,
                    username: newUser.username,
                    full_name: newUser.full_name,
                    role: newUser.role
                };
                setUsers(prev => [...prev, addedUser].sort((a, b) => a.full_name.localeCompare(b.full_name)));

            } else if (modalMode === "edit" && currentUserId) {
                const userRef = doc(db, "users", currentUserId);
                const updateData: any = {
                    full_name: formData.full_name,
                    role: formData.role
                };

                // Only update password if provided
                if (formData.password.trim() !== "") {
                    if (formData.password.length < 6) {
                        setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
                        setIsSaving(false);
                        return;
                    }
                    updateData.password = await hashPassword(formData.password);
                }

                await updateDoc(userRef, updateData);

                // Update local state
                setUsers(users.map(u =>
                    u.id === currentUserId
                        ? { ...u, full_name: formData.full_name, role: formData.role }
                        : u
                ));
            }

            setIsModalOpen(false);
        } catch (err: any) {
            console.error("Error saving user:", err);
            setError("Lỗi khi lưu thông tin tài khoản: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (user: UserAccount) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản của ${user.full_name}?`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, "users", user.id));
            setUsers(users.filter(u => u.id !== user.id));
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Lỗi khi xóa tài khoản.");
        }
    };

    return (
        <div className="view-account-container">
            <div className="view-account-content">

                {/* Header */}
                <div className="header-section">
                    <div className="header-title">
                        <h1>Quản Lý Tài Khoản</h1>
                        <p>Danh sách người dùng hệ thống</p>
                    </div>
                    <button
                        className="btn-save"
                        style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                        onClick={handleAddClick}
                    >
                        + Thêm Tài Khoản
                    </button>
                </div>

                {/* Data Card */}
                <div className="data-card">

                    {/* Search Bar */}
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Tìm kiếm theo tên hoặc tên đăng nhập..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="account-table">
                                <thead>
                                    <tr>
                                        <th>Người dùng</th>
                                        <th>Tên đăng nhập</th>
                                        <th>Vai trò</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="user-info">
                                                        <div className="avatar">
                                                            {user.full_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{user.full_name}</span>
                                                    </div>
                                                </td>
                                                <td>{user.username}</td>
                                                <td>
                                                    <span className={`role-badge role-${user.role || 'user'}`}>
                                                        {user.role || 'user'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-icon btn-edit"
                                                            title="Chỉnh sửa"
                                                            onClick={() => handleEditClick(user)}
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-delete"
                                                            title="Xóa"
                                                            onClick={() => handleDeleteUser(user)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                                Không tìm thấy tài khoản nào phù hợp.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Combined Add/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modalMode === "add" ? "Thêm tài khoản mới" : "Chỉnh sửa tài khoản"}</h2>
                            {modalMode === "edit" && (
                                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
                                    Tài khoản: <strong>{formData.username}</strong>
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: '1.5rem', padding: '0.75rem', fontSize: '0.9rem' }}>
                                <span>⚠️ {error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Họ và tên</label>
                                <input
                                    type="text"
                                    className="modal-input"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Nhập họ và tên"
                                    required
                                />
                            </div>

                            {modalMode === "add" && (
                                <div className="form-group">
                                    <label>Tên đăng nhập</label>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="Nhập tên đăng nhập"
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>{modalMode === "add" ? "Mật khẩu" : "Mật khẩu mới (để trống nếu không đổi)"}</label>
                                <input
                                    type="password"
                                    className="modal-input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={modalMode === "add" ? "Nhập mật khẩu (tối thiểu 6 ký tự)" : "Nhập mật khẩu mới"}
                                    required={modalMode === "add"}
                                />
                            </div>

                            <div className="form-group">
                                <label>Vai trò (Role)</label>
                                <select
                                    className="modal-select"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="user">User - Chỉ xem</option>
                                    <option value="admin">Admin - Toàn quyền</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-save" disabled={isSaving}>
                                    {isSaving ? "Đang lưu..." : modalMode === "add" ? "Tạo tài khoản" : "Cập nhật"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Background Decorations */}
            <div className="bg-decoration bg-1" style={{ position: 'absolute', top: '-10%', right: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(255, 59, 48, 0.05) 0%, transparent 70%)', zIndex: 0 }}></div>
            <div className="bg-decoration bg-2" style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.03) 0%, transparent 70%)', zIndex: 0 }}></div>
        </div>
    );
}
