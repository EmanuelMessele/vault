// page is used for handling authentication logic across the app, including login, registration, and logout
import {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { User, AuthResponse } from '../types';

export function useAuth() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = async (email: string, password:string) => {
        try {
            setLoading(true)
            setError(null)
            const response = await api.post<AuthResponse>('/auth/login', {email, password})
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    const register = async( email: string, password: string, full_name:string) => {
        try {
            setLoading(true) // set loading state to true when registration starts
            setError(null) // clear any previous errors
            const response = await api.post<AuthResponse>('/auth/register', {email, password, full_name})
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    const getUser = (): User | null => {
        const user = localStorage.getItem('user')
        return user ? JSON.parse(user) : null
    }

    const isAuthenticated = () => {
        return !!localStorage.getItem('token')
    }

    return {login, register, logout, getUser, isAuthenticated, loading, error}

}