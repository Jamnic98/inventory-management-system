import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

export default function LoginVerify() {
  const [searchParams] = useSearchParams()
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')

    if (token) {
      loginWithToken(token)
        .then(() => {
          // navigate to dashboard
          navigate('/', { replace: true })
        })
        .catch((err) => {
          console.error('Login failed:', err)
          navigate('/login?error=invalid-token', { replace: true })
        })
    }
  }, [searchParams, loginWithToken, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Verifying your magic link...</p>
      </div>
    </div>
  )
}
