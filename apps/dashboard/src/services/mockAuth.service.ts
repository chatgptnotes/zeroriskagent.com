// Mock Authentication Service
// This simulates Supabase authentication without requiring a real database

export interface MockUser {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface MockUserProfile {
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
  created_at: string
  updated_at: string
}

export interface MockSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: MockUser
}

// Mock Users Database
const MOCK_USERS: Record<string, { password: string; profile: MockUserProfile }> = {
  'admin@hopehospital.com': {
    password: 'admin123',
    profile: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      email: 'admin@hopehospital.com',
      full_name: 'Super Administrator',
      phone: '+91-9876543210',
      role: 'super_admin',
      hospital_id: undefined,
      hospital_name: undefined,
      can_approve_appeals: true,
      can_view_financials: true,
      can_export_data: true,
      status: 'active',
      last_login_at: new Date().toISOString(),
      created_at: '2026-01-11T00:00:00Z',
      updated_at: new Date().toISOString()
    }
  },
  'hope@hopehospital.com': {
    password: 'hope123',
    profile: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      email: 'hope@hopehospital.com',
      full_name: 'Hope Hospital Admin',
      phone: '+91-9876543211',
      role: 'hospital_admin',
      hospital_id: 'hope-hospital-id',
      hospital_name: 'Hope Hospital',
      can_approve_appeals: true,
      can_view_financials: true,
      can_export_data: true,
      status: 'active',
      last_login_at: new Date().toISOString(),
      created_at: '2026-01-11T00:00:00Z',
      updated_at: new Date().toISOString()
    }
  },
  'staff@hopehospital.com': {
    password: 'staff123',
    profile: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      email: 'staff@hopehospital.com',
      full_name: 'Billing Staff Member',
      phone: '+91-9876543212',
      role: 'staff',
      hospital_id: 'hope-hospital-id',
      hospital_name: 'Hope Hospital',
      can_approve_appeals: false,
      can_view_financials: false,
      can_export_data: false,
      status: 'active',
      last_login_at: new Date().toISOString(),
      created_at: '2026-01-11T00:00:00Z',
      updated_at: new Date().toISOString()
    }
  }
}

// Local Storage Keys
const STORAGE_KEYS = {
  SESSION: 'zerorisk_mock_session',
  USER: 'zerorisk_mock_user',
  PROFILE: 'zerorisk_mock_profile'
}

// Mock Authentication Service
export class MockAuthService {
  private currentSession: MockSession | null = null
  private currentUser: MockUser | null = null
  private currentProfile: MockUserProfile | null = null

  constructor() {
    // Load saved session from localStorage
    this.loadSavedSession()
  }

  // Load session from localStorage
  private loadSavedSession() {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION)
      const userData = localStorage.getItem(STORAGE_KEYS.USER)
      const profileData = localStorage.getItem(STORAGE_KEYS.PROFILE)

      if (sessionData && userData && profileData) {
        const session = JSON.parse(sessionData)
        // Check if session is still valid (24 hours)
        if (Date.now() < session.expires_at) {
          this.currentSession = session
          this.currentUser = JSON.parse(userData)
          this.currentProfile = JSON.parse(profileData)
        } else {
          this.signOut()
        }
      }
    } catch (error) {
      console.error('Error loading saved session:', error)
      this.signOut()
    }
  }

  // Save session to localStorage
  private saveSession(session: MockSession, user: MockUser, profile: MockUserProfile) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session))
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile))
  }

  // Clear session from localStorage
  private clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION)
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.PROFILE)
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ session: MockSession | null; error: string | null }> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        const mockUser = MOCK_USERS[email.toLowerCase()]
        
        if (!mockUser || mockUser.password !== password) {
          resolve({
            session: null,
            error: 'Invalid email or password'
          })
          return
        }

        // Create session
        const user: MockUser = {
          id: mockUser.profile.id,
          email: mockUser.profile.email,
          created_at: mockUser.profile.created_at,
          updated_at: mockUser.profile.updated_at
        }

        const session: MockSession = {
          access_token: `mock_token_${Date.now()}`,
          refresh_token: `mock_refresh_${Date.now()}`,
          expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
          user
        }

        // Update last login
        mockUser.profile.last_login_at = new Date().toISOString()

        this.currentSession = session
        this.currentUser = user
        this.currentProfile = mockUser.profile

        // Save to localStorage
        this.saveSession(session, user, mockUser.profile)

        resolve({
          session,
          error: null
        })
      }, 500) // Simulate 500ms delay
    })
  }

  // Sign up (for admin registration)
  async signUp(email: string, password: string, userData: {
    full_name: string
    role: string
    hospital_id?: string
  }): Promise<{ user: MockUser | null; error: string | null }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (MOCK_USERS[email.toLowerCase()]) {
          resolve({
            user: null,
            error: 'User already exists'
          })
          return
        }

        // Create new user (in real app, this would go to database)
        const newId = `mock_${Date.now()}`
        const now = new Date().toISOString()
        
        const newUser: MockUser = {
          id: newId,
          email,
          created_at: now,
          updated_at: now
        }

        const newProfile: MockUserProfile = {
          id: newId,
          email,
          full_name: userData.full_name,
          role: userData.role as any,
          hospital_id: userData.hospital_id,
          hospital_name: userData.hospital_id === 'hope-hospital-id' ? 'Hope Hospital' : undefined,
          can_approve_appeals: userData.role === 'hospital_admin' || userData.role === 'super_admin',
          can_view_financials: userData.role === 'hospital_admin' || userData.role === 'super_admin',
          can_export_data: userData.role === 'hospital_admin' || userData.role === 'super_admin',
          status: 'active',
          created_at: now,
          updated_at: now
        }

        // Save to mock database (in-memory)
        MOCK_USERS[email.toLowerCase()] = {
          password,
          profile: newProfile
        }

        resolve({
          user: newUser,
          error: null
        })
      }, 800)
    })
  }

  // Sign out
  async signOut(): Promise<void> {
    this.currentSession = null
    this.currentUser = null
    this.currentProfile = null
    this.clearSession()
  }

  // Get current session
  getSession(): { session: MockSession | null; user: MockUser | null } {
    return {
      session: this.currentSession,
      user: this.currentUser
    }
  }

  // Get current user profile
  getProfile(): MockUserProfile | null {
    return this.currentProfile
  }

  // Listen for auth changes (mock implementation)
  onAuthStateChange(callback: (session: MockSession | null) => void) {
    // Call immediately with current state
    callback(this.currentSession)
    
    // Return unsubscribe function
    return {
      unsubscribe: () => {
        // Mock unsubscribe
      }
    }
  }

  // Update profile
  async updateProfile(updates: Partial<MockUserProfile>): Promise<{ error: string | null }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!this.currentProfile || !this.currentUser) {
          resolve({ error: 'No user logged in' })
          return
        }

        // Update profile
        this.currentProfile = { ...this.currentProfile, ...updates, updated_at: new Date().toISOString() }
        
        // Update in mock database
        const email = this.currentUser.email
        if (MOCK_USERS[email]) {
          MOCK_USERS[email].profile = this.currentProfile
        }

        // Save to localStorage
        if (this.currentSession) {
          this.saveSession(this.currentSession, this.currentUser, this.currentProfile)
        }

        resolve({ error: null })
      }, 300)
    })
  }
}

// Export singleton instance
export const mockAuth = new MockAuthService()