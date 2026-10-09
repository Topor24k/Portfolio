import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Null when the env vars are missing, so the site can fall back to its bundled projects.
export const supabase = url && key ? createClient(url, key) : null

export const STORAGE_BUCKET = 'portfolio'
