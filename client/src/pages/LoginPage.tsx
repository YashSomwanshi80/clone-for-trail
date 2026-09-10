import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { NeonReveal } from '@/components/ui/NeonReveal'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!revealed) return
    setError(null)
    if (!userId.trim() || !password.trim()) {
      setError('Enter a user ID and password to continue')
      return
    }
    setLoading(true)
    try {
      await login(userId.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed — check your credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <NeonReveal
      revealDelay={250}
      revealDuration={1400}
      hue={172}
      intensity={1.1}
      onComplete={() => setRevealed(true)}
      className="min-h-screen bg-obsidian flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-teal/12 text-teal">
            <Radio className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">City ANPR Platform</h1>
          <p className="mt-1 text-[13px] text-text-tertiary">ANPR Operations · sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} aria-disabled={!revealed} className="rounded-xl border border-border-soft bg-graphite p-6 space-y-4">
          <fieldset disabled={!revealed} className="space-y-4 border-0 p-0 m-0">
            <Input
              label="User ID"
              name="userId"
              autoComplete="username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. ops.singh"
            />
            <div className="space-y-1.5">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                error={error ?? undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-[11px] text-text-tertiary hover:text-text-secondary"
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </fieldset>

          <p className="text-[11px] text-text-tertiary text-center">
            Demo build — any of ops.singh, insp.rao, insp.mehta, viewer.kumar with any password
          </p>
        </form>

        <div className="mt-4 flex justify-center">
          <Badge tone="neutral">LOCAL DEV</Badge>
        </div>
      </div>
    </NeonReveal>
  )
}
