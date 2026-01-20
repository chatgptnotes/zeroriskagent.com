import { useAuth } from '../hooks/useAuth'

interface MockModeMessageProps {
  pageName: string
  description: string
  children?: React.ReactNode
}

export default function MockModeMessage({ pageName, description, children }: MockModeMessageProps) {
  const { isMockMode } = useAuth()

  if (!isMockMode) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md text-center p-8">
        {/* Mock Mode Indicator */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md text-sm flex items-center justify-center gap-2 mb-6">
          <span className="material-icon text-sm">info</span>
          <strong>Mock Data Mode Active</strong>
        </div>

        {/* Page Icon */}
        <div className="bg-primary-100 rounded-full p-6 inline-block mb-4">
          <span className="material-icon text-primary-600" style={{ fontSize: '48px' }}>construction</span>
        </div>

        {/* Page Info */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageName}</h1>
        <p className="text-gray-600 mb-6">{description}</p>

        {/* Coming Soon Message */}
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-icon text-sm">schedule</span>
            <strong>Coming Soon</strong>
          </div>
          <p>This page will have mock data in the next version. Currently showing the main Dashboard with complete mock data.</p>
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center gap-2"
          >
            <span className="material-icon">dashboard</span>
            View Dashboard with Mock Data
          </button>
          
          <p className="text-xs text-gray-500">
            The main Dashboard has complete mock data including claims, recoveries, and analytics.
          </p>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-left bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">To enable this page:</h3>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Set up Supabase project</li>
            <li>Configure environment variables</li>
            <li>Run database migrations</li>
            <li>The system will automatically switch to live data</li>
          </ol>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 mt-8">
          <p>v1.1 - 2026-01-20 - zeroriskagent.com</p>
        </footer>
      </div>
    </div>
  )
}