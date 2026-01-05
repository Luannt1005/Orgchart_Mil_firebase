"use client";

import { useState, useEffect } from "react";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { hashPassword } from "@/lib/password";
import {
    MagnifyingGlassIcon,
    PencilSquareIcon,
    TrashIcon,
    UserPlusIcon
} from "@heroicons/react/24/outline";

interface UserAccount {
    id: string;
    username: string;
    full_name: string;
    role: string;
    createdAt?: any;
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserAccount[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal
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
                setError(result.message || "Cannot load accounts");
            }
        } catch (err: any) {
            console.error(err);
            setError("Connection error");
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
            password: "",
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
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "==", formData.username));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    setError("Username already exists");
                    setIsSaving(false);
                    return;
                }

                if (formData.password.length < 6) {
                    setError("Password must be at least 6 chars");
                    setIsSaving(false);
                    return;
                }

                const hashedPassword = await hashPassword(formData.password);
                const newUser = {
                    username: formData.username,
                    full_name: formData.full_name,
                    password: hashedPassword,
                    role: formData.role,
                    createdAt: new Date().toISOString()
                };

                const docRef = await addDoc(collection(db, "users"), newUser);
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

                if (formData.password.trim() !== "") {
                    if (formData.password.length < 6) {
                        setError("New password must be at least 6 chars");
                        setIsSaving(false);
                        return;
                    }
                    updateData.password = await hashPassword(formData.password);
                }

                await updateDoc(userRef, updateData);
                setUsers(users.map(u =>
                    u.id === currentUserId
                        ? { ...u, full_name: formData.full_name, role: formData.role }
                        : u
                ));
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (user: UserAccount) => {
        if (!confirm(`Are you sure you want to delete ${user.full_name}?`)) return;

        try {
            await deleteDoc(doc(db, "users", user.id));
            setUsers(users.filter(u => u.id !== user.id));
        } catch (err) {
            alert("Delete failed");
        }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">All Accounts</span>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {filteredUsers.length}
                    </span>
                </div>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                    <UserPlusIcon className="w-4 h-4" />
                    New Account
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Search */}
                <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by name or username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Loading accounts...</span>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">User</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Username</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Role</th>
                                    <th className="py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center text-xs font-bold shadow-sm border border-indigo-50">
                                                    {user.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{user.username}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize border ${user.role === 'admin'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                    : 'bg-green-50 text-green-700 border-green-100'
                                                }`}>
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-gray-400 text-sm">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalMode === 'add' ? 'New Account' : 'Edit Account'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">×</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>

                            {modalMode === 'add' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Username</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">
                                    {modalMode === 'add' ? 'Password' : 'New Password (optional)'}
                                </label>
                                <input
                                    type="password"
                                    required={modalMode === 'add'}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={modalMode === 'edit' ? "Leave blank to keep current" : ""}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Role</label>
                                <select
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="user">User (Read Only)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Saving...' : 'Save Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
