import { useNavigate } from 'react-router-dom'
import { Bot, Zap, Shield, BarChart3, Mail, MessageSquare, Globe, ArrowRight, Check } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">Orstra AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            Sign in
          </button>
          <button
            onClick={() => navigate('/login')}
            className="bg-brand-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors"
          >
            Get started free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} />
          No-code AI agents, live in minutes
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Build AI agents that work<br />
          <span className="text-brand-500">while you sleep</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Create intelligent agents that reply to emails, update your CRM, search your knowledge base, and more — no code required.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="bg-brand-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 text-base"
          >
            Start building free <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 font-medium px-6 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-base"
          >
            See a demo
          </button>
        </div>
      </section>

      {/* Demo screenshot placeholder */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gray-900 rounded-2xl p-4 shadow-2xl">
          <div className="flex gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'completed', intent: 'tracking order status', cost: '$0.006', conf: '94%' },
              { label: 'completed', intent: 'refund request', cost: '$0.004', conf: '88%' },
              { label: 'escalated', intent: 'billing dispute', cost: '$0.005', conf: '61%' },
            ].map((run, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-3 text-left">
                <div className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${run.label === 'completed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                  {run.label}
                </div>
                <p className="text-white text-xs font-medium mb-1">{run.intent}</p>
                <p className="text-gray-400 text-xs">{run.conf} confidence · {run.cost}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">How it works</h2>
          <p className="text-center text-gray-500 mb-14">Build a working AI agent in 5 steps</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Name it', desc: 'Give your agent a name and describe what it should do' },
              { step: '2', title: 'Set trigger', desc: 'Email, webhook, or schedule — pick how it wakes up' },
              { step: '3', title: 'Pick tools', desc: 'Gmail, Slack, Shopify, search docs — choose its powers' },
              { step: '4', title: 'Add rules', desc: 'Set guardrails so it knows when to escalate to a human' },
              { step: '5', title: 'Deploy', desc: 'Go live. Your agent starts working automatically' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">Everything your agents need</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Mail, title: 'Email automation', desc: 'Reply to customer emails automatically using your knowledge base and rules' },
            { icon: MessageSquare, title: 'Slack notifications', desc: 'Post summaries, alerts, and reports directly to your Slack channels' },
            { icon: Globe, title: 'Web search', desc: 'Agents can search the web in real-time to answer questions with current info' },
            { icon: Zap, title: 'Webhook triggers', desc: 'Connect to Zapier, Make, or any tool. Your agent fires on any external event' },
            { icon: Shield, title: 'Guardrails', desc: 'Set confidence thresholds, keyword escalations, and cost limits to stay safe' },
            { icon: BarChart3, title: 'Run analytics', desc: 'Every run is logged with intent, cost, tools used, and full output history' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="border border-gray-200 rounded-xl p-5 hover:border-brand-200 hover:bg-brand-50/30 transition-colors">
              <div className="w-9 h-9 bg-brand-100 rounded-lg flex items-center justify-center mb-3">
                <Icon size={18} className="text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Simple pricing</h2>
          <p className="text-center text-gray-500 mb-12">Start free. Pay only for what you use.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-1">Free</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">$0 <span className="text-base font-normal text-gray-400">/ month</span></p>
              <ul className="space-y-2 mb-6">
                {['3 agents', 'Unlimited test runs', 'Webhook triggers', 'Gmail + Slack connectors', 'Pay-per-use AI (your API key)'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-green-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login')} className="w-full py-2.5 border border-brand-500 text-brand-500 font-medium rounded-lg hover:bg-brand-50 transition-colors text-sm">
                Get started free
              </button>
            </div>
            <div className="bg-brand-500 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-1">Pro</h3>
              <p className="text-3xl font-bold mb-4">$29 <span className="text-base font-normal opacity-70">/ month</span></p>
              <ul className="space-y-2 mb-6">
                {['Unlimited agents', 'Priority support', 'Scheduled runs', 'All connectors', 'Team collaboration', 'Custom branding'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm opacity-90">
                    <Check size={14} className="shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login')} className="w-full py-2.5 bg-white text-brand-600 font-medium rounded-lg hover:bg-brand-50 transition-colors text-sm">
                Start free trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to automate your workflow?</h2>
        <p className="text-gray-500 mb-8">Join teams already using Orstra AI to handle emails, support, and data — automatically.</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-brand-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-600 transition-colors inline-flex items-center gap-2"
        >
          Build your first agent free <ArrowRight size={18} />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© 2026 Orstra AI. Built with Claude.</p>
      </footer>
    </div>
  )
}
