import { useState } from 'react'

export default function LandingPage() {
  const [deniedAmount, setDeniedAmount] = useState('1000000')

  const calculateROI = () => {
    const denied = parseFloat(deniedAmount) || 0
    const recoveryRate = 0.60
    const recovered = denied * recoveryRate
    const agentFee = recovered * 0.25
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/50 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
                <span className="material-icon text-white" style={{ fontSize: '28px' }}>local_hospital</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Zero Risk Agent</h1>
                <p className="text-xs text-gray-400">AI Revenue Recovery</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors duration-200">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-300 hover:text-white transition-colors duration-200">How It Works</a>
              <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors duration-200">Pricing</a>
              <a href="#roi" className="text-sm text-gray-300 hover:text-white transition-colors duration-200">ROI Calculator</a>
              <a href="/recovery" className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative px-6 py-2.5 bg-slate-900 rounded-lg flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '18px' }}>receipt_long</span>
                  <span className="text-sm font-medium">Recovery</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-5xl mx-auto relative z-10">
            {/* Atomic Animation with Title */}
            <div className="flex flex-col items-center justify-center mb-12">
              <AtomicAnimation />
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mt-8 leading-tight pb-4">
                <span className="block bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  Zero Risk
                </span>
                <span className="block mt-2 pb-2 bg-gradient-to-r from-red-400 via-orange-400 to-red-500 bg-clip-text text-transparent animate-gradient">
                  Agent
                </span>
              </h1>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2.5 rounded-full text-sm font-medium mb-8 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
              <span className="material-icon text-red-400 group-hover:rotate-12 transition-transform duration-300" style={{ fontSize: '20px' }}>auto_awesome</span>
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Powered by Advanced AI</span>
            </div>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-4xl mx-auto">
              AI-powered platform recovering <span className="text-red-400 font-semibold">millions in denied claims</span> from ESIC, CGHS, and ECHS.
              <span className="block mt-2 text-lg text-gray-400">You only pay when we win.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300 animate-gradient"></div>
                <div className="relative px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl flex items-center justify-center gap-3 text-lg font-bold shadow-2xl group-hover:scale-105 transition-transform duration-200">
                  <span className="material-icon group-hover:rotate-12 transition-transform duration-300">rocket_launch</span>
                  <span>Start Recovering Now</span>
                </div>
              </button>

              <button className="relative px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold hover:bg-white/15 transition-all duration-200 group">
                <span className="material-icon group-hover:scale-110 transition-transform duration-300">play_circle</span>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ModernStatCard
                icon="attach_money"
                value="₹50Cr+"
                label="Total Recovered"
                gradient="from-green-500 to-emerald-500"
              />
              <ModernStatCard
                icon="trending_up"
                value="65%"
                label="Success Rate"
                gradient="from-blue-500 to-cyan-500"
              />
              <ModernStatCard
                icon="schedule"
                value="45 Days"
                label="Avg Recovery Time"
                gradient="from-purple-500 to-pink-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Built specifically for Indian healthcare, powered by cutting-edge AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            <GlassCard
              icon="psychology"
              title="AI-Powered Appeals"
              description="Advanced AI analyzes denials, reviews records, and generates compelling appeals citing specific policy clauses."
              gradient="from-blue-500 to-cyan-500"
            />
            <GlassCard
              icon="security"
              title="Zero Risk Pricing"
              description="No upfront costs. No monthly fees. Pay only 25% of what we recover. If we don't win, you don't pay."
              gradient="from-green-500 to-emerald-500"
            />
            <GlassCard
              icon="account_balance"
              title="Multi-Payer Support"
              description="Specialized workflows for ESIC, CGHS, ECHS, and private insurers. We know each payer's requirements."
              gradient="from-purple-500 to-pink-500"
            />
            <GlassCard
              icon="speed"
              title="Automated Workflows"
              description="From denial detection to appeal submission, everything happens automatically, saving countless hours."
              gradient="from-orange-500 to-red-500"
            />
            <GlassCard
              icon="analytics"
              title="Real-Time Dashboard"
              description="Track every claim, denial, and recovery in real-time with comprehensive analytics and insights."
              gradient="from-pink-500 to-rose-500"
            />
            <GlassCard
              icon="school"
              title="Learning System"
              description="Our AI learns from every claim, building a knowledge graph that improves success rates over time."
              gradient="from-indigo-500 to-purple-500"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Four simple steps to start recovering your lost revenue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            <StepCardModern
              number="1"
              icon="upload"
              title="Import Claims"
              description="Connect your billing system or upload claims. We handle all Indian payer formats."
            />
            <StepCardModern
              number="2"
              icon="search"
              title="AI Analysis"
              description="Our AI detects denials, analyzes reasons, and scores recovery probability instantly."
            />
            <StepCardModern
              number="3"
              icon="edit_document"
              title="Generate Appeals"
              description="AI drafts compelling appeals with medical justification and policy references."
            />
            <StepCardModern
              number="4"
              icon="payments"
              title="Get Paid"
              description="We handle submission and follow-up. Split: 75% to you, 25% to us."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Only pay when we win. No hidden fees. No surprises.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Gain-Share Model</h3>
                  <p className="text-lg text-gray-400">Performance-based pricing aligned with your success</p>
                </div>
                <div className="hidden md:block">
                  <span className="material-icon text-primary-400" style={{ fontSize: '80px' }}>handshake</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <PricingFeatureModern icon="block" title="₹0 Upfront" description="No setup fees or monthly charges" />
                <PricingFeatureModern icon="percent" title="25% Fee" description="Only on recovered amounts" />
                <PricingFeatureModern icon="currency_rupee" title="₹5,000 Min" description="We pursue viable claims" />
              </div>

              <div className="bg-slate-900/50 rounded-2xl p-8 border border-white/10">
                <h4 className="font-semibold text-xl mb-6 text-gray-200">Example Calculation:</h4>
                <div className="space-y-4 text-base">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <span className="text-gray-400">Denied claim amount:</span>
                    <span className="font-semibold text-white text-lg">₹1,00,000</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <span className="text-gray-400">Successfully recovered (60%):</span>
                    <span className="font-semibold text-white text-lg">₹60,000</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <span className="text-gray-400">Our fee (25%):</span>
                    <span className="font-semibold text-red-400 text-lg">₹15,000</span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="font-bold text-white text-lg">You receive:</span>
                    <span className="font-bold text-green-400 text-2xl">₹45,000</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-gray-400 mt-8">
                If we don't recover the claim, you pay nothing. Zero risk to your hospital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="roi" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 relative z-10">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Calculate Your Recovery
            </h2>
            <p className="text-xl text-gray-400">
              See how much you could recover from denied claims
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <div className="mb-8">
                <label className="label text-lg text-gray-300 mb-3 block">Your Total Denied Claims Amount</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-2xl font-bold">₹</span>
                  <input
                    type="number"
                    value={deniedAmount}
                    onChange={(e) => setDeniedAmount(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/20 text-white text-3xl font-bold pl-12 pr-6 py-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="1000000"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-8 border border-green-500/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <ROIMetricModern
                    label="Estimated Recovery"
                    value={formatCurrency(roi.recovered)}
                    sublabel="at 60% success rate"
                    icon="trending_up"
                    color="green"
                  />
                  <ROIMetricModern
                    label="Our Fee"
                    value={formatCurrency(roi.agentFee)}
                    sublabel="25% of recovery"
                    icon="receipt"
                    color="blue"
                  />
                  <ROIMetricModern
                    label="Your Net Gain"
                    value={formatCurrency(roi.hospitalNet)}
                    sublabel="in your account"
                    icon="account_balance_wallet"
                    color="purple"
                  />
                </div>

                <div className="pt-6 border-t border-green-500/20 text-center">
                  <p className="text-sm text-gray-400 mb-6">
                    Based on our average 60% recovery rate across 500+ hospitals
                  </p>
                  <button className="group relative w-full sm:w-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                    <div className="relative px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center gap-3 font-bold group-hover:scale-105 transition-transform duration-200">
                      <span className="material-icon">rocket_launch</span>
                      <span>Start Recovering Today</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Trusted by Leading Hospitals
            </h2>
            <p className="text-xl text-gray-400">
              Join hundreds of hospitals already recovering millions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <TestimonialCardModern
              hospital="Hope Hospital, Mumbai"
              quote="Zero Risk Agent recovered ₹45 lakhs in denied ESIC claims in just 3 months. The AI-generated appeals are incredibly detailed."
              name="Dr. Rajesh Kumar"
              role="Medical Director"
            />
            <TestimonialCardModern
              hospital="City Care Hospital, Delhi"
              quote="The gain-share model is brilliant. No upfront cost, and we only pay when they succeed. 62% recovery rate on CGHS denials."
              name="Mrs. Priya Sharma"
              role="Chief Financial Officer"
            />
            <TestimonialCardModern
              hospital="Metro Clinic, Bangalore"
              quote="The dashboard gives complete visibility. The AI is learning our patterns and getting better every month. Highly recommended."
              name="Dr. Amit Patel"
              role="Hospital Administrator"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-3xl p-16 border border-white/10">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Ready to Recover?
              </h2>
              <p className="text-2xl mb-10 text-gray-300">
                Start with zero risk. We only win when you win.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                  <div className="relative px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center gap-3 text-lg font-bold group-hover:scale-105 transition-transform duration-200">
                    <span className="material-icon">contact_mail</span>
                    <span>Schedule Demo</span>
                  </div>
                </button>
                <button className="relative px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold hover:bg-white/15 transition-all duration-200">
                  <span className="material-icon">call</span>
                  <span>Call: +91-22-12345678</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-900/80 backdrop-blur-xl border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
                  <span className="material-icon text-white" style={{ fontSize: '24px' }}>local_hospital</span>
                </div>
                <span className="font-bold text-white text-lg">Zero Risk Agent</span>
              </div>
              <p className="text-sm text-gray-400">
                AI-powered healthcare revenue recovery for Indian hospitals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-red-400 transition">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-red-400 transition">Pricing</a></li>
                <li><a href="#roi" className="text-gray-400 hover:text-red-400 transition">ROI Calculator</a></li>
                <li><a href="/recovery" className="text-gray-400 hover:text-red-400 transition">Recovery Dashboard</a></li>
                <li><a href="/nmi" className="text-gray-400 hover:text-red-400 transition">NMI Tracker</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-red-400 transition">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-red-400 transition">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-red-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-red-400 transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="material-icon" style={{ fontSize: '16px' }}>email</span>
                  admin@hopehospital.com
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="material-icon" style={{ fontSize: '16px' }}>call</span>
                  +91-22-12345678
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="material-icon" style={{ fontSize: '16px' }}>location_on</span>
                  Mumbai, Maharashtra
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-500">
            <p>Version 1.2 | Last Updated: 2026-01-12 | zeroriskagent.com</p>
            <p className="mt-2">Copyright © 2026 Zero Risk Agent. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Modern Components

function ModernStatCard({ icon, value, label, gradient }: { icon: string; value: string; label: string; gradient: string }) {
  return (
    <div className="group relative">
      <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-300`}></div>
      <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:scale-105 transition-transform duration-300">
        <div className={`inline-flex p-3 bg-gradient-to-r ${gradient} rounded-xl mb-3`}>
          <span className="material-icon text-white" style={{ fontSize: '28px' }}>{icon}</span>
        </div>
        <div className="text-4xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </div>
  )
}

function GlassCard({ icon, title, description, gradient }: { icon: string; title: string; description: string; gradient: string }) {
  return (
    <div className="group relative">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300`}></div>
      <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:scale-105 transition-all duration-300 h-full">
        <div className={`inline-flex p-4 bg-gradient-to-r ${gradient} rounded-xl mb-6 shadow-lg`}>
          <span className="material-icon text-white" style={{ fontSize: '32px' }}>{icon}</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function StepCardModern({ number, icon, title, description }: { number: string; icon: string; title: string; description: string }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
      <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:scale-105 transition-all duration-300">
        <div className="absolute -top-4 -left-4 bg-gradient-to-br from-red-600 to-orange-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-xl">
          {number}
        </div>
        <div className="text-red-400 mb-4 mt-4">
          <span className="material-icon" style={{ fontSize: '40px' }}>{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function PricingFeatureModern({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-slate-900/30 rounded-xl border border-white/10">
      <div className="bg-gradient-to-br from-red-600 to-orange-600 text-white p-3 rounded-lg flex-shrink-0">
        <span className="material-icon" style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      <div>
        <div className="font-bold text-white text-lg mb-1">{title}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
    </div>
  )
}

function ROIMetricModern({ label, value, sublabel, icon, color }: { label: string; value: string; sublabel: string; icon: string; color: string }) {
  const colorClasses = {
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
  }

  return (
    <div className="text-center p-4 bg-slate-900/30 rounded-xl border border-white/10">
      <div className={`inline-flex p-3 bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} rounded-lg mb-3`}>
        <span className="material-icon text-white" style={{ fontSize: '28px' }}>{icon}</span>
      </div>
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500">{sublabel}</div>
    </div>
  )
}

function TestimonialCardModern({ hospital, quote, name, role }: { hospital: string; quote: string; name: string; role: string }) {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
      <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:scale-105 transition-all duration-300 h-full flex flex-col">
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="material-icon text-yellow-400" style={{ fontSize: '20px' }}>star</span>
          ))}
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed flex-grow italic">"{quote}"</p>
        <div className="border-t border-white/10 pt-6">
          <div className="font-bold text-white text-lg">{name}</div>
          <div className="text-sm text-gray-400">{role}</div>
          <div className="text-xs text-red-400 mt-2 font-medium">{hospital}</div>
        </div>
      </div>
    </div>
  )
}

function AtomicAnimation() {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Nucleus */}
      <div className="absolute w-16 h-16 bg-gradient-to-br from-red-400 via-orange-500 to-red-500 rounded-full shadow-2xl animate-pulse z-10">
        <div className="absolute inset-2 bg-gradient-to-br from-white to-red-200 rounded-full"></div>
      </div>

      {/* Orbit 1 */}
      <div className="absolute w-48 h-48 border-2 border-red-400/30 rounded-full orbit-1">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-red-400 to-orange-500 rounded-full shadow-lg electron"></div>
      </div>

      {/* Orbit 2 */}
      <div className="absolute w-56 h-56 border-2 border-orange-400/30 rounded-full orbit-2">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg electron"></div>
      </div>

      {/* Orbit 3 */}
      <div className="absolute w-64 h-64 border-2 border-red-400/30 rounded-full orbit-3">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-red-400 to-orange-500 rounded-full shadow-lg electron"></div>
      </div>
    </div>
  )
}
