import { useState } from 'react'

export default function LandingPage() {
  const [deniedAmount, setDeniedAmount] = useState('1000000')

  const calculateROI = () => {
    const denied = parseFloat(deniedAmount) || 0
    const recoveryRate = 0.60 // 60% recovery rate
    const recovered = denied * recoveryRate
    const agentFee = recovered * 0.25 // 25% agent fee
    const hospitalNet = recovered - agentFee
    return { recovered, agentFee, hospitalNet }
  }

  const roi = calculateROI()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="material-icon text-primary-600" style={{ fontSize: '32px' }}>local_hospital</span>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Zero Risk Agent</h1>
                <p className="text-xs text-gray-500">Healthcare Revenue Recovery</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-primary-600 transition">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-primary-600 transition">How It Works</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-primary-600 transition">Pricing</a>
              <a href="#roi" className="text-sm text-gray-600 hover:text-primary-600 transition">ROI Calculator</a>
              <a href="/dashboard" className="btn-primary text-sm">
                <span className="material-icon" style={{ fontSize: '18px' }}>dashboard</span>
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="material-icon" style={{ fontSize: '18px' }}>auto_awesome</span>
              AI-Powered Revenue Recovery
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Recover Your Denied
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"> Insurance Claims </span>
              Automatically
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Zero Risk Agent uses advanced AI to fight denied ESIC, CGHS, and ECHS claims, recovering millions in lost revenue for Indian hospitals. You only pay when we win.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-all duration-200 flex items-center justify-center gap-2 text-lg font-semibold shadow-lg hover:shadow-xl">
                <span className="material-icon">rocket_launch</span>
                Get Started Free
              </button>
              <button className="bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 text-lg font-semibold border-2 border-gray-200">
                <span className="material-icon">play_circle</span>
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <StatCard icon="attach_money" value="₹50Cr+" label="Total Recovered" color="green" />
              <StatCard icon="trending_up" value="65%" label="Avg Success Rate" color="blue" />
              <StatCard icon="schedule" value="45 Days" label="Avg Recovery Time" color="purple" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Zero Risk Agent?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by cutting-edge AI, designed specifically for Indian healthcare systems
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="psychology"
              title="AI-Powered Appeals"
              description="Our advanced AI analyzes denial reasons, reviews medical records, and generates compelling appeals citing specific policy clauses."
              color="blue"
            />
            <FeatureCard
              icon="security"
              title="Zero Risk Pricing"
              description="No upfront costs. No monthly fees. You only pay 25% of what we successfully recover. If we don't win, you don't pay."
              color="green"
            />
            <FeatureCard
              icon="account_balance"
              title="Multi-Payer Support"
              description="Specialized workflows for ESIC, CGHS, ECHS, and private insurers. We know each payer's unique requirements."
              color="purple"
            />
            <FeatureCard
              icon="speed"
              title="Automated Workflows"
              description="From denial detection to appeal submission, our platform handles everything automatically, saving your team countless hours."
              color="orange"
            />
            <FeatureCard
              icon="analytics"
              title="Real-Time Dashboard"
              description="Track every claim, denial, and recovery in real-time. Get actionable insights with comprehensive analytics."
              color="pink"
            />
            <FeatureCard
              icon="school"
              title="Learning System"
              description="Our AI learns from every claim, building a knowledge graph that improves success rates over time."
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Four simple steps to start recovering your lost revenue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StepCard
              number="1"
              icon="upload"
              title="Import Claims"
              description="Connect your billing system or upload claims via CSV. We handle ESIC, CGHS, and ECHS formats."
            />
            <StepCard
              number="2"
              icon="search"
              title="AI Analysis"
              description="Our AI automatically detects denials, analyzes reasons, and scores recovery probability."
            />
            <StepCard
              number="3"
              icon="edit_document"
              title="Generate Appeals"
              description="AI drafts compelling appeals with medical justification and policy references specific to each payer."
            />
            <StepCard
              number="4"
              icon="payments"
              title="Get Paid"
              description="We handle submission and follow-up. When payment arrives, we split: 75% to you, 25% to us."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Only pay when we win. No hidden fees. No surprises.
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-12 border-2 border-primary-200 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Gain-Share Model</h3>
                <p className="text-lg text-gray-600">Performance-based pricing aligned with your success</p>
              </div>
              <div className="hidden md:block">
                <span className="material-icon text-primary-600" style={{ fontSize: '64px' }}>handshake</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <PricingFeature icon="block" title="₹0 Upfront" description="No setup fees or monthly charges" />
              <PricingFeature icon="percent" title="25% Fee" description="Only on successfully recovered amounts" />
              <PricingFeature icon="currency_rupee" title="₹5,000 Min" description="We only pursue viable claims" />
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Example Calculation:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Denied claim amount:</span>
                  <span className="font-medium">₹1,00,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Successfully recovered (60%):</span>
                  <span className="font-medium">₹60,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Our fee (25%):</span>
                  <span className="font-medium text-primary-600">₹15,000</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-gray-200">
                  <span className="font-semibold text-gray-900">You receive:</span>
                  <span className="font-bold text-green-600 text-lg">₹45,000</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 mt-6">
              If we don't recover the claim, you pay nothing. Zero risk to your hospital.
            </p>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="roi" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Calculate Your Potential Recovery</h2>
            <p className="text-xl text-gray-600">
              See how much you could recover from your denied claims
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="mb-8">
              <label className="label text-lg">Your Total Denied Claims Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                <input
                  type="number"
                  value={deniedAmount}
                  onChange={(e) => setDeniedAmount(e.target.value)}
                  className="input text-2xl font-semibold pl-8 py-4"
                  placeholder="1000000"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ROIMetric
                  label="Estimated Recovery"
                  value={formatCurrency(roi.recovered)}
                  sublabel="at 60% success rate"
                  icon="trending_up"
                  color="green"
                />
                <ROIMetric
                  label="Our Fee"
                  value={formatCurrency(roi.agentFee)}
                  sublabel="25% of recovery"
                  icon="receipt"
                  color="blue"
                />
                <ROIMetric
                  label="Your Net Gain"
                  value={formatCurrency(roi.hospitalNet)}
                  sublabel="money in your account"
                  icon="account_balance_wallet"
                  color="purple"
                />
              </div>

              <div className="mt-6 pt-6 border-t border-green-200 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Based on our average 60% recovery rate across 500+ hospitals
                </p>
                <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 mx-auto font-semibold">
                  <span className="material-icon">rocket_launch</span>
                  Start Recovering Today
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by Leading Hospitals</h2>
            <p className="text-xl text-gray-600">
              Join hundreds of hospitals already recovering millions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              hospital="Hope Hospital, Mumbai"
              quote="Zero Risk Agent recovered ₹45 lakhs in denied ESIC claims in just 3 months. The AI-generated appeals are incredibly detailed and cite exact policy clauses."
              name="Dr. Rajesh Kumar"
              role="Medical Director"
            />
            <TestimonialCard
              hospital="City Care Hospital, Delhi"
              quote="The gain-share model is brilliant. No upfront cost, and we only pay when they succeed. They've recovered 62% of our CGHS denials so far."
              name="Mrs. Priya Sharma"
              role="Chief Financial Officer"
            />
            <TestimonialCard
              hospital="Metro Clinic, Bangalore"
              quote="The dashboard gives us complete visibility into every claim. The AI is learning our patterns and getting better every month. Highly recommended."
              name="Dr. Amit Patel"
              role="Hospital Administrator"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Recover Your Lost Revenue?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start with zero risk. We only win when you win.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2 text-lg font-semibold shadow-lg">
              <span className="material-icon">contact_mail</span>
              Schedule Demo
            </button>
            <button className="bg-transparent text-white px-8 py-4 rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2 text-lg font-semibold border-2 border-white">
              <span className="material-icon">call</span>
              Call Us: +91-22-12345678
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icon text-primary-400" style={{ fontSize: '28px' }}>local_hospital</span>
                <span className="font-bold text-white text-lg">Zero Risk Agent</span>
              </div>
              <p className="text-sm">
                AI-powered healthcare revenue recovery for Indian hospitals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-primary-400 transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary-400 transition">Pricing</a></li>
                <li><a href="#roi" className="hover:text-primary-400 transition">ROI Calculator</a></li>
                <li><a href="/dashboard" className="hover:text-primary-400 transition">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Contact</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '18px' }}>email</span>
                  admin@hopehospital.com
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '18px' }}>call</span>
                  +91-22-12345678
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '18px' }}>location_on</span>
                  Mumbai, Maharashtra
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>Version 1.1 • Last Updated: 2026-01-11 • zeroriskagent.com</p>
            <p className="mt-2">Copyright © 2026 Zero Risk Agent. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Component Helpers

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className={`inline-flex p-3 rounded-lg mb-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
        <span className="material-icon" style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }: { icon: string; title: string; description: string; color: string }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    pink: 'text-pink-600 bg-pink-50',
    indigo: 'text-indigo-600 bg-indigo-50',
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-200 border border-gray-100">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
        <span className="material-icon" style={{ fontSize: '28px' }}>{icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({ number, icon, title, description }: { number: string; icon: string; title: string; description: string }) {
  return (
    <div className="relative">
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-primary-100 hover:border-primary-300 transition-colors duration-200">
        <div className="absolute -top-4 -left-4 bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
          {number}
        </div>
        <div className="text-primary-600 mb-3 mt-2">
          <span className="material-icon" style={{ fontSize: '32px' }}>{icon}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function PricingFeature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-primary-600 text-white p-2 rounded-lg">
        <span className="material-icon" style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div>
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </div>
  )
}

function ROIMetric({ label, value, sublabel, icon, color }: { label: string; value: string; sublabel: string; icon: string; color: string }) {
  const colorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  }

  return (
    <div className="text-center">
      <div className={`${colorClasses[color as keyof typeof colorClasses]} mb-2`}>
        <span className="material-icon" style={{ fontSize: '32px' }}>{icon}</span>
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{sublabel}</div>
    </div>
  )
}

function TestimonialCard({ hospital, quote, name, role }: { hospital: string; quote: string; name: string; role: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-icon text-yellow-500">star</span>
        <span className="material-icon text-yellow-500">star</span>
        <span className="material-icon text-yellow-500">star</span>
        <span className="material-icon text-yellow-500">star</span>
        <span className="material-icon text-yellow-500">star</span>
      </div>
      <p className="text-gray-700 mb-4 leading-relaxed">"{quote}"</p>
      <div className="border-t border-gray-100 pt-4">
        <div className="font-semibold text-gray-900">{name}</div>
        <div className="text-sm text-gray-600">{role}</div>
        <div className="text-xs text-primary-600 mt-1">{hospital}</div>
      </div>
    </div>
  )
}
