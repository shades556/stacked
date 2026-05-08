import { createAuthClient } from "better-auth/svelte"

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"

export const authClient = createAuthClient({
    baseURL: API_BASE_URL
})
