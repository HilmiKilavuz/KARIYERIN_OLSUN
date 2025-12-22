"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:4000/api/auth';

interface User {
    id: number;
    email: string;
    ad_soyad: string;
    profile_id?: number;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, ad_soyad: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check localStorage for persisted user
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("AuthContext: Failed to access localStorage", error);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            if (res.data.success) {
                const userData = res.data.user;
                setUser(userData);
                try {
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch (e) {
                    console.error("AuthContext: Failed to save to localStorage", e);
                }
                toast.success(`Hoş geldin, ${userData.ad_soyad}!`);
                router.push('/dashboard');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Giriş başarısız.';
            toast.error(msg);
            throw new Error(msg);
        }
    };

    const register = async (email: string, password: string, ad_soyad: string) => {
        try {
            const res = await axios.post(`${API_URL}/register`, { email, password, ad_soyad });
            if (res.data.success) {
                toast.success('Kayıt başarılı! Lütfen giriş yapın.');
                router.push('/login');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Kayıt başarısız.';
            toast.error(msg);
            throw new Error(msg);
        }
    };

    const logout = () => {
        setUser(null);
        try {
            localStorage.removeItem('user');
        } catch (e) {
            console.error("AuthContext: Failed to remove from localStorage", e);
        }
        toast.success('Çıkış yapıldı.');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
