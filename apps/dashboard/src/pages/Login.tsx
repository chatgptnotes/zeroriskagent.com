import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

export default function Login() {
  const { signIn, user, loading: authLoading, isMockMode } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Handle registration success message
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Registration successful! Please check your email for verification (if required) and login.')
    }
  }, [searchParams])

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard')
    }
  }, [user, authLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }

    try {
      setLoading(true)
      const { error } = await signIn(formData.email, formData.password)

      if (error) {
        setError(error.message)
        return
      }

      // Success - navigation will happen via useEffect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-icon text-primary-600 animate-pulse" style={{ fontSize: '48px' }}>autorenew</span>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <span className="material-icon text-primary-600" style={{ fontSize: '48px' }}>local_hospital</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zero Risk Agent
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-2">
              <span className="material-icon">error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center gap-2">
              <span className="material-icon">check_circle</span>
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-icon animate-spin mr-2">autorenew</span>
                  Signing in...
                </>
              ) : (
                <>
                  <span className="material-icon mr-2">login</span>
                  Sign In
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Need an admin account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Register here
                </Link>
              </span>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className={`${isMockMode ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-green-50 border-green-200 text-green-700'} px-4 py-3 rounded-md text-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icon">info</span>
                  <strong>{isMockMode ? 'Mock Authentication Mode' : 'Database Authentication Mode'}</strong>
                </div>
                <p className="text-xs mb-2">
                  {isMockMode 
                    ? 'No database required - using local authentication'
                    : 'Using zero_login_user database table'
                  }
                </p>
                <div className="space-y-1 text-xs">
                  <div><strong>Super Admin:</strong> admin@hopehospital.com / admin123</div>
                  <div><strong>Hospital Admin:</strong> hope@hopehospital.com / hope123</div>
                  <div><strong>Staff:</strong> staff@hopehospital.com / staff123</div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <footer className="text-center text-xs text-gray-400 mt-8">
          <p>v1.3 - 2026-01-21 - zeroriskagent.com</p>
        </footer>
      </div>
    </div>
  )
}