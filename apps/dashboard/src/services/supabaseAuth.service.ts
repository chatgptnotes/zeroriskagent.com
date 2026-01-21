// Supabase Authentication Service for zero_login_user table
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase credentials are available
const hasSupabaseCredentials = supabaseUrl && supabaseAnonKey

// Create Supabase client only if credentials exist
export const supabase = hasSupabaseCredentials ? createClient(supabaseUrl, supabaseAnonKey) : null

// User interface matching zero_login_user table
export interface ZeroLoginUser {
  id: string
  email: string
  full_name: string
  password: string // Note: This is stored as plain text in the simple table
  role: 'super_admin' | 'hospital_admin' | 'staff'
  status: string
  created_at: string
}

// Authentication result interface
export interface AuthResult {
  user: ZeroLoginUser | null
  error: string | null
}

export class SupabaseAuthService {
  private currentUser: ZeroLoginUser | null = null

  constructor() {
    // Load saved user from localStorage if available
    this.loadSavedUser()
  }

  // Check if Supabase is available
  isAvailable(): boolean {
    return supabase !== null
  }

  // Load user from localStorage synchronously, verify in background
  private loadSavedUser() {
    try {
      const userData = localStorage.getItem('zerorisk_supabase_user')
      if (userData) {
        const user = JSON.parse(userData)
        // Set user immediately (synchronous) to prevent race condition
        this.currentUser = user

        // Verify user is still valid in background (non-blocking)
        // Only sign out if verification explicitly fails
        this.verifyUser(user.id).then((isValid) => {
          if (!isValid) {
            console.log('User verification failed, signing out')
            this.signOut()
          }
        }).catch((error) => {
          console.error('User verification error:', error)
          // Only sign out on explicit verification failure, not network errors
        })
      }
    } catch (error) {
      console.error('Error loading saved user:', error)
      this.currentUser = null
      this.clearUser()
    }
  }

  // Save user to localStorage
  private saveUser(user: ZeroLoginUser) {
    localStorage.setItem('zerorisk_supabase_user', JSON.stringify(user))
  }

  // Clear user from localStorage
  private clearUser() {
    localStorage.removeItem('zerorisk_supabase_user')
  }

  // Verify user still exists in database
  private async verifyUser(userId: string): Promise<boolean> {
    if (!supabase) return false

    try {
      const { data, error } = await supabase
        .from('zero_login_user')
        .select('id')
        .eq('id', userId)
        .eq('status', 'active')
        .single()

      return !error && data !== null
    } catch {
      return false
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) {
      return {
        user: null,
        error: 'Database connection not available'
      }
    }

    try {
      // Query zero_login_user table
      const { data, error } = await supabase
        .from('zero_login_user')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('password', password) // Note: Plain text comparison (not secure for production)
        .eq('status', 'active')
        .single()

      if (error || !data) {
        return {
          user: null,
          error: 'Invalid email or password'
        }
      }

      // Create user object
      const user: ZeroLoginUser = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        password: data.password,
        role: data.role,
        status: data.status,
        created_at: data.created_at
      }

      // Save current user
      this.currentUser = user
      this.saveUser(user)

      return {
        user,
        error: null
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }

  // Sign up (create new user)
  async signUp(email: string, password: string, userData: {
    full_name: string
    role: string
  }): Promise<AuthResult> {
    if (!supabase) {
      return {
        user: null,
        error: 'Database connection not available'
      }
    }

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('zero_login_user')
        .select('email')
        .eq('email', email.toLowerCase())
        .single()

      if (existingUser) {
        return {
          user: null,
          error: 'User already exists'
        }
      }

      // Create new user
      const { data, error } = await supabase
        .from('zero_login_user')
        .insert({
          email: email.toLowerCase(),
          password: password, // Note: Plain text storage (not secure for production)
          full_name: userData.full_name,
          role: userData.role,
          status: 'active'
        })
        .select()
        .single()

      if (error || !data) {
        return {
          user: null,
          error: error?.message || 'Failed to create user'
        }
      }

      // Create user object
      const user: ZeroLoginUser = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        password: data.password,
        role: data.role,
        status: data.status,
        created_at: data.created_at
      }

      return {
        user,
        error: null
      }
    } catch (error) {
      console.error('Signup error:', error)
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Signup failed'
      }
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    this.currentUser = null
    this.clearUser()
  }

  // Get current user
  getCurrentUser(): ZeroLoginUser | null {
    return this.currentUser
  }

  // Update user profile
  async updateProfile(updates: Partial<Omit<ZeroLoginUser, 'id' | 'email' | 'created_at'>>): Promise<{ error: string | null }> {
    if (!supabase || !this.currentUser) {
      return { error: 'Not authenticated' }
    }

    try {
      const { data, error } = await supabase
        .from('zero_login_user')
        .update(updates)
        .eq('id', this.currentUser.id)
        .select()
        .single()

      if (error || !data) {
        return { error: error?.message || 'Failed to update profile' }
      }

      // Update current user
      this.currentUser = {
        ...this.currentUser,
        ...updates
      }
      this.saveUser(this.currentUser)

      return { error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      return { error: error instanceof Error ? error.message : 'Update failed' }
    }
  }

  // Get all users (admin function)
  async getAllUsers(): Promise<{ users: ZeroLoginUser[] | null; error: string | null }> {
    if (!supabase) {
      return {
        users: null,
        error: 'Database connection not available'
      }
    }

    try {
      const { data, error } = await supabase
        .from('zero_login_user')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return {
          users: null,
          error: error.message
        }
      }

      return {
        users: data || [],
        error: null
      }
    } catch (error) {
      console.error('Get users error:', error)
      return {
        users: null,
        error: error instanceof Error ? error.message : 'Failed to fetch users'
      }
    }
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService()