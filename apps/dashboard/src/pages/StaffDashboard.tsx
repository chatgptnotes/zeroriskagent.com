import { useEffect, useState } from 'react'

export default function StaffDashboard() {
  const [todayStats, setTodayStats] = useState({
    claimsProcessed: 0,
    pendingTasks: 0,
    completedTasks: 0,
    hoursWorked: 0
  })

  const [weeklyStats, setWeeklyStats] = useState({
    totalClaims: 0,
    successfulAppeals: 0,
    avgProcessingTime: 0,
    productivityScore: 0
  })

  useEffect(() => {
    fetchStaffStats()
  }, [])

  async function fetchStaffStats() {
    // Mock data for staff
    setTodayStats({
      claimsProcessed: 12,
      pendingTasks: 8,
      completedTasks: 15,
      hoursWorked: 6.5
    })

    setWeeklyStats({
      totalClaims: 67,
      successfulAppeals: 48,
      avgProcessingTime: 2.3,
      productivityScore: 92
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Today's Work Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StaffCard
              icon="assignment_turned_in"
              iconColor="green"
              value={todayStats.claimsProcessed}
              label="Claims Processed"
              subtext="Today"
            />
            <StaffCard
              icon="pending_actions"
              iconColor="orange"
              value={todayStats.pendingTasks}
              label="Pending Tasks"
              subtext="In queue"
            />
            <StaffCard
              icon="check_circle"
              iconColor="blue"
              value={todayStats.completedTasks}
              label="Completed Tasks"
              subtext="Today"
            />
            <StaffCard
              icon="schedule"
              iconColor="purple"
              value={`${todayStats.hoursWorked}h`}
              label="Hours Worked"
              subtext="Today"
            />
          </div>
        </div>

        {/* Weekly Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">trending_up</span>
              Weekly Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Claims Processed</span>
                <span className="text-lg font-semibold">{weeklyStats.totalClaims}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Successful Appeals</span>
                <span className="text-lg font-semibold text-green-600">{weeklyStats.successfulAppeals}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Avg Processing Time</span>
                <span className="text-lg font-semibold text-blue-600">{weeklyStats.avgProcessingTime}h</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-600">Productivity Score</span>
                <span className="text-lg font-semibold text-purple-600">{weeklyStats.productivityScore}%</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">emoji_events</span>
              Achievements
            </h3>
            <div className="space-y-3">
              <AchievementItem 
                icon="stars"
                title="High Performer"
                description="Processed 50+ claims this week"
                earned={true}
              />
              <AchievementItem 
                icon="speed"
                title="Speed Demon"
                description="Average processing under 3 hours"
                earned={true}
              />
              <AchievementItem 
                icon="verified"
                title="Quality Expert"
                description="95% success rate this month"
                earned={false}
              />
              <AchievementItem 
                icon="trending_up"
                title="Consistency King"
                description="Meet targets for 30 days straight"
                earned={false}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">assignment</span>
              My Tasks
            </h3>
            <div className="space-y-3">
              <a href="/nmi" className="btn-primary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>business</span>
                  Collection Tracker
                </span>
                <span className="material-icon">arrow_forward</span>
              </a>
              <button className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>upload</span>
                  Upload Claims
                </span>
                <span className="material-icon">arrow_forward</span>
              </button>
              <button className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>edit</span>
                  Update Status
                </span>
                <span className="material-icon">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">help</span>
              Resources & Help
            </h3>
            <div className="space-y-3">
              <button className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>school</span>
                  Training Materials
                </span>
                <span className="material-icon">arrow_forward</span>
              </button>
              <button className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>policy</span>
                  Policy Guidelines
                </span>
                <span className="material-icon">arrow_forward</span>
              </button>
              <button className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>support_agent</span>
                  Contact Support
                </span>
                <span className="material-icon">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="material-icon text-primary-600">history</span>
            Recent Activity
          </h3>
          <div className="space-y-3">
            <TaskItem 
              icon="check_circle" 
              text="Processed CGHS claim #12345 - Approved" 
              time="30 mins ago"
              status="completed"
            />
            <TaskItem 
              icon="edit" 
              text="Updated ESIC appeal documentation #12346" 
              time="1 hour ago"
              status="completed"
            />
            <TaskItem 
              icon="upload" 
              text="Uploaded 5 new claims to system" 
              time="2 hours ago"
              status="completed"
            />
            <TaskItem 
              icon="pending" 
              text="ECHS claim #12347 - Pending review" 
              time="3 hours ago"
              status="pending"
            />
            <TaskItem 
              icon="error" 
              text="Claim #12348 - Documentation missing" 
              time="4 hours ago"
              status="action_required"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          <p>v1.2 | Last Updated: 2026-01-20 | zeroriskagent.com | Staff Access</p>
        </div>
      </footer>
    </div>
  )
}

function StaffCard({
  icon,
  iconColor,
  value,
  label,
  subtext,
}: {
  icon: string
  iconColor: string
  value: number | string
  label: string
  subtext: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className={`material-icon ${colorClasses[iconColor]}`}>{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{subtext}</p>
    </div>
  )
}

function AchievementItem({
  icon,
  title,
  description,
  earned
}: {
  icon: string
  title: string
  description: string
  earned: boolean
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${earned ? 'bg-yellow-50' : 'bg-gray-50'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${earned ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
        <span className="material-icon" style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${earned ? 'text-gray-900' : 'text-gray-600'}`}>{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {earned && (
        <span className="material-icon text-yellow-600" style={{ fontSize: '20px' }}>check_circle</span>
      )}
    </div>
  )
}

function TaskItem({
  icon,
  text,
  time,
  status
}: {
  icon: string
  text: string
  time: string
  status: 'completed' | 'pending' | 'action_required'
}) {
  const statusClasses = {
    completed: 'text-green-600 bg-green-50',
    pending: 'text-orange-600 bg-orange-50',
    action_required: 'text-red-600 bg-red-50'
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusClasses[status]}`}>
        <span className="material-icon" style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{text}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  )
}