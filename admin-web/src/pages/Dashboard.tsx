import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { TesterBoard } from '@/components/TesterBoard'
import { SmartInsightFeedback } from '@/components/SmartInsightFeedback'
import { FeedbackBoard } from '@/components/FeedbackBoard'
import { ReferralBoard } from '@/components/ReferralBoard'

type Tab = 'testers' | 'insights' | 'feedback' | 'referrals'

const TABS: { key: Tab; label: string }[] = [
  { key: 'testers',   label: 'Tester Board' },
  { key: 'insights',  label: '✨ Smart Insights' },
  { key: 'feedback',  label: '⭐ Rate Feedback' },
  { key: 'referrals', label: '🎁 Referrals' },
]

export function Dashboard() {
  const { session, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('testers')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">BUFF Admin</h1>
            <p className="text-xs text-muted-foreground">
              {TABS.find(t => t.key === tab)?.label}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session?.user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mx-auto flex max-w-7xl gap-0 px-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {tab === 'testers'   && <TesterBoard />}
        {tab === 'insights'  && <SmartInsightFeedback />}
        {tab === 'feedback'  && <FeedbackBoard />}
        {tab === 'referrals' && <ReferralBoard />}
      </main>
    </div>
  )
}
