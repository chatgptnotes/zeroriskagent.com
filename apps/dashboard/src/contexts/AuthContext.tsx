import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { mockAuth, MockUser, MockUserProfile, MockSession } from '../services/mockAuth.service'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'hospital_admin' | 'billing_staff' | 'doctor' | 'agent_admin' | 'super_admin'
  hospital_id?: string
  hospital_name?: string
  can_approve_appeals: boolean
  can_view_financials: boolean
  can_export_data: boolean
  status: 'active' | 'suspended' | 'inactive'
  last_login_at?: string
}

interface AuthContextType {
  user: SupabaseUser | MockUser | null
  profile: UserProfile | null
  session: Session | MockSession | null
  loading: boolean
  signUp: (email: string, password: string, userData: {
    full_name: string
    role: string
    hospital_id?: string
  }) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>
  isAdmin: boolean
  isSuperAdmin: boolean
  canViewFinancials: boolean
  canExportData: boolean
  canApproveAppeals: boolean
  isMockMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | MockUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | MockSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMockMode, setIsMockMode] = useState(false)

  // Check if we should use mock mode (when Supabase is not configured)
  const shouldUseMockMode = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    return !supabaseUrl || 
           !supabaseKey || 
           supabaseUrl === 'https://your-project.supabase.co' ||
           supabaseKey === 'your-anon-key'
  }

  useEffect(() => {
    const useMock = shouldUseMockMode()
    setIsMockMode(useMock)

    if (useMock) {
      console.log('🔄 Using Mock Authentication Mode')
      initializeMockAuth()
    } else {
      console.log('🔄 Using Supabase Authentication')
      initializeSupabaseAuth()
    }
  }, [])

  // Initialize Mock Authentication
  const initializeMockAuth = () => {
    const { session: mockSession, user: mockUser } = mockAuth.getSession()
    const mockProfile = mockAuth.getProfile()

    setSession(mockSession)
    setUser(mockUser)
    setProfile(mockProfile as UserProfile | null)
    setLoading(false)

    // Listen for auth changes
    mockAuth.onAuthStateChange((newSession) => {
      setSession(newSession)
      setUser(newSession?.user || null)
      setProfile(mockAuth.getProfile() as UserProfile | null)
    })
  }

  // Initialize Supabase Authentication
  const initializeSupabaseAuth = () => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          hospitals:hospital_id (
            name
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        const profileData: UserProfile = {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          hospital_id: data.hospital_id,
          hospital_name: data.hospitals?.name,
          can_approve_appeals: data.can_approve_appeals,
          can_view_financials: data.can_view_financials,
          can_export_data: data.can_export_data,
          status: data.status,
          last_login_at: data.last_login_at,
        }
        setProfile(profileData)

        // Update last login
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', userId)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData: {
    full_name: string
    role: string
    hospital_id?: string
  }) => {
    if (isMockMode) {
      const { user: mockUser, error } = await mockAuth.signUp(email, password, userData)
      return { error: error ? new Error(error) : null }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) return { error }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            full_name: userData.full_name,
            role: userData.role,
            hospital_id: userData.hospital_id,
            can_approve_appeals: userData.role === 'hospital_admin' || userData.role === 'super_admin',
            can_view_financials: userData.role === 'hospital_admin' || userData.role === 'super_admin',
            can_export_data: userData.role === 'hospital_admin' || userData.role === 'super_admin',
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          return { error: profileError }
        }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (isMockMode) {
      const { session: mockSession, error } = await mockAuth.signIn(email, password)
      if (mockSession) {
        setSession(mockSession)
        setUser(mockSession.user)
        setProfile(mockAuth.getProfile() as UserProfile | null)
      }
      return { error: error ? new Error(error) : null }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    if (isMockMode) {
      await mockAuth.signOut()
      setSession(null)
      setUser(null)
      setProfile(null)
    } else {
      await supabase.auth.signOut()
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (isMockMode) {
      const { error } = await mockAuth.updateProfile(updates as Partial<MockUserProfile>)
      if (!error) {
        setProfile(mockAuth.getProfile() as UserProfile | null)
      }
      return { error: error ? new Error(error) : null }
    }

    if (!user) return { error: 'No user found' }

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) return { error }

      // Refresh profile
      await fetchProfile(user.id)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Helper properties
  const isAdmin = profile?.role === 'hospital_admin' || profile?.role === 'super_admin' || profile?.role === 'agent_admin'
  const isSuperAdmin = profile?.role === 'super_admin'
  const canViewFinancials = profile?.can_view_financials || false
  const canExportData = profile?.can_export_data || false
  const canApproveAppeals = profile?.can_approve_appeals || false

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin,
    isSuperAdmin,
    canViewFinancials,
    canExportData,
    canApproveAppeals,
    isMockMode,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}