import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { mockAuth, MockUser, MockUserProfile, MockSession } from '../services/mockAuth.service'
import { supabaseAuth, ZeroLoginUser } from '../services/supabaseAuth.service'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'hospital_admin' | 'staff' | 'super_admin'
  hospital_id?: string
  hospital_name?: string
  can_approve_appeals: boolean
  can_view_financials: boolean
  can_export_data: boolean
  status: 'active' | 'suspended' | 'inactive'
  last_login_at?: string
}

interface AuthContextType {
  user: SupabaseUser | MockUser | ZeroLoginUser | null
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
  const [user, setUser] = useState<SupabaseUser | MockUser | ZeroLoginUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | MockSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMockMode, setIsMockMode] = useState(false)

  // Check if we should use mock mode (when Supabase is not configured)
  const shouldUseMockMode = () => {
    return !supabaseAuth.isAvailable()
  }

  useEffect(() => {
    const useMock = shouldUseMockMode()
    setIsMockMode(useMock)

    if (useMock) {
      console.log('🔄 Using Mock Authentication Mode')
      initializeMockAuth()
    } else {
      console.log('🔄 Using Database Authentication (zero_login_user)')
      initializeDatabaseAuth()
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

  // Initialize Database Authentication (zero_login_user)
  const initializeDatabaseAuth = () => {
    // Get user synchronously from localStorage (already loaded in SupabaseAuthService constructor)
    const currentUser = supabaseAuth.getCurrentUser()

    if (currentUser) {
      console.log('Auth initialized with user:', currentUser.email, 'role:', currentUser.role)
      setUser(currentUser)
      const userProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.full_name,
        role: currentUser.role,
        can_approve_appeals: currentUser.role === 'super_admin' || currentUser.role === 'hospital_admin',
        can_view_financials: currentUser.role === 'super_admin' || currentUser.role === 'hospital_admin',
        can_export_data: currentUser.role === 'super_admin' || currentUser.role === 'hospital_admin',
        status: currentUser.status as 'active' | 'suspended' | 'inactive'
      }
      setProfile(userProfile)
    } else {
      console.log('Auth initialized: no saved user found')
    }
    setLoading(false)
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
      const { user: _mockUser, error } = await mockAuth.signUp(email, password, userData)
      return { error: error ? new Error(error) : null }
    }

    // Use database authentication for signup
    const { user: _dbUser, error } = await supabaseAuth.signUp(email, password, {
      full_name: userData.full_name,
      role: userData.role
    })

    if (error) {
      return { error: new Error(error) }
    }

    return { error: null }
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

    // Use database authentication
    const { user: dbUser, error } = await supabaseAuth.signIn(email, password)
    
    if (error) {
      return { error: new Error(error) }
    }

    if (dbUser) {
      setUser(dbUser)
      const userProfile: UserProfile = {
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name,
        role: dbUser.role,
        can_approve_appeals: dbUser.role === 'super_admin' || dbUser.role === 'hospital_admin',
        can_view_financials: dbUser.role === 'super_admin' || dbUser.role === 'hospital_admin',
        can_export_data: dbUser.role === 'super_admin' || dbUser.role === 'hospital_admin',
        status: dbUser.status as 'active' | 'suspended' | 'inactive'
      }
      setProfile(userProfile)
    }

    return { error: null }
  }

  const signOut = async () => {
    if (isMockMode) {
      await mockAuth.signOut()
    } else {
      await supabaseAuth.signOut()
    }
    setSession(null)
    setUser(null)
    setProfile(null)
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
  const isAdmin = profile?.role === 'hospital_admin' || profile?.role === 'super_admin'
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