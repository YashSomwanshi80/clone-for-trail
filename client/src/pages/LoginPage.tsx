import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Camera } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { javaPost_noAuth, setAccessToken, prefetchCsrf } from '@/lib/api/http'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { push } = useToast()
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      push('error', 'Username and password required')
      return
    }

    setLoading(true)
    try {
      const response = await javaPost_noAuth<{ accessToken: string, cameraId: string | null, cityId: string | null }>('/api/v1/auth/login', {
        username: username.trim(),
        password: password.trim(),
      })

      // Store the token in our HTTP client
      setAccessToken(response.accessToken)

      // Ensure CSRF token is fetched so state-changing requests work
      await prefetchCsrf()

      push('success', `Logged in as ${username}`)
      
      navigate('/nodes')
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-deep-graphite flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-teal/10 flex items-center justify-center text-teal mb-4">
            <Camera className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">City ANPR Platform</h1>
          <p className="text-sm text-text-secondary mt-1">Sign in to continue</p>
        </div>

        <Card>
          <CardHeader title="Authentication" icon={<KeyRound className="w-4 h-4" />} />
          <CardBody>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                disabled={loading}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full justify-center"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
