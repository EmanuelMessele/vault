// this file is for defining TypeScript types used across the frontend application
export interface User{
    id: string
    email: string
    full_name: string
    created_at: string
}

export interface Collection{
    id: string
    user_id: string
    name: string
    description: string | null
    created_at: string
    deleted_at: string | null
}

export interface Document{
    id: string
    collection_id: string
    user_id: string
    file_name: string
    file_type: string
    file_size: number
    storage_key: string
    processing_status: 'pending' | 'processing' | 'completed' | 'failed'
    created_at: string
    deleted_at: string | null
}

export interface AuthResponse{
    user: User
    token: string
}

export interface ApiError{
    error: string
}