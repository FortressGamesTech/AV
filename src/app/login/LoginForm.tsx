'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/utils/supabase'

type Mode = 'signIn' | 'signUp' | 'reset'

export default function LoginForm({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Reset error/success and clear fields when mode changes
  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setSuccess(null)
    setEmail('')
    setPassword('')
    setName('')
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (error) {
      setError(error.message || 'Could not authenticate user')
    } else {
      router.push('/')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const origin = window.location.origin
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback`,
        data: { name, role: 'event_coordinator' },
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message || 'Could not authenticate user')
    } else {
      // Redirect to login with message
      router.push('/login?message=Check your email to continue sign in process')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const origin = window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/api/auth/callback`,
    })
    setLoading(false)
    if (error) {
      setError(error.message || 'Could not send reset email')
    } else {
      // Redirect to login with message
      router.push('/login?message=Check your email for a password reset link')
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-2 text-foreground animate-in">
      {mode === 'signIn' && (
        <form onSubmit={handleSignIn} className="flex flex-col gap-2">
          <label className="text-md" htmlFor="email">
            Email
          </label>
          <input
            className="mb-6 rounded-md border bg-inherit px-4 py-2"
            name="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="text-md" htmlFor="password">
            Password
          </label>
          <input
            className="mb-6 rounded-md border bg-inherit px-4 py-2"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="mb-2 rounded-md bg-green-700 px-4 py-2 text-foreground"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <div className="mt-2 flex justify-between text-sm">
            <button
              type="button"
              className="text-blue-500 hover:underline"
              onClick={() => switchMode('reset')}
            >
              Forgot Password?
            </button>
            <button
              type="button"
              className="text-blue-500 hover:underline"
              onClick={() => switchMode('signUp')}
            >
              Create an Account?
            </button>
          </div>
        </form>
      )}

      {mode === 'signUp' && (
        <form onSubmit={handleSignUp} className="flex flex-col gap-2">
          <label className="text-md" htmlFor="name">
            Name
          </label>
          <input
            className="mb-6 rounded-md border bg-inherit px-4 py-2"
            name="name"
            placeholder="Your Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="text-md" htmlFor="email">
            Email
          </label>
          <input
            className="mb-6 rounded-md border bg-inherit px-4 py-2"
            name="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="text-md" htmlFor="password">
            Password
          </label>
          <input
            className="mb-6 rounded-md border bg-inherit px-4 py-2"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="mb-2 rounded-md bg-green-700 px-4 py-2 text-foreground"
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
          <div className="mt-2 flex justify-between text-sm">
            <button
              type="button"
              className="text-blue-500 hover:underline"
              onClick={() => switchMode('signIn')}
            >
              Already have an account? Sign In
            </button>
          </div>
        </form>
      )}

      {mode === 'reset' && (
        <form
          onSubmit={handleResetPassword}
          className="mb-2 flex flex-col gap-2 rounded border p-2"
        >
          <label className="text-md" htmlFor="reset_email">
            Enter your email to reset password
          </label>
          <input
            className="mb-2 rounded-md border bg-inherit px-4 py-2"
            name="reset_email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-md bg-green-700 px-4 py-2 text-foreground"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
          <div className="mt-2 flex justify-between text-sm">
            <button
              type="button"
              className="text-blue-500 hover:underline"
              onClick={() => switchMode('signIn')}
            >
              Back to Sign In
            </button>
          </div>
        </form>
      )}

      {(error || searchParams?.message) && (
        <p className="mt-4 rounded bg-red-100 p-4 text-center text-red-800">
          {error || searchParams?.message}
        </p>
      )}
      {success && (
        <p className="mt-4 rounded bg-green-100 p-4 text-center text-green-800">
          {success}
        </p>
      )}
    </div>
  )
}
