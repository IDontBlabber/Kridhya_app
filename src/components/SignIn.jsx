import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { passwordProblem, resendConfirmation, sendCode, sendPasswordReset, signInWithPassword, signUp, verifyCode } from '../lib/auth'
import { IconArrow } from './Icons'
import { LotusMark } from './Logo'

// Customer authentication: sign in / create account with email + password (email verified), forgot password,
// or a one-time email code. Supabase Auth issues the signed session tokens (JWT) the server checks.
export default function SignIn({ title = 'Welcome to Kridhya', intro = 'Sign in or create an account to check out, save your bag and follow your orders.', onDone, initialMode = 'signin' }) {
  const { setUser, ensure } = useAuth()
  const [mode, setMode] = useState(initialMode) // signin | signup | forgot | code | code-verify | sent
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', code: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: k === 'code' ? e.target.value.replace(/\D/g, '') : e.target.value }))

  useEffect(() => { ensure() }, [ensure]) // load the auth library while they type
  useEffect(() => {
    if (!cooldown) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const go = (m) => { setMode(m); setError(''); setNotice('') }
  const emailOk = () => /^\S+@\S+\.\S+$/.test(f.email.trim())
  const attempt = async (fn) => {
    setError('')
    setBusy(true)
    try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const done = (user) => { setUser(user); onDone?.(user) }

  const submit = (e) => {
    e.preventDefault()
    if (!['code-verify'].includes(mode) && !emailOk()) return setError('Please enter a valid email address.')
    if (mode === 'signin') {
      if (!f.password) return setError('Enter your password.')
      return attempt(async () => done(await signInWithPassword(f.email, f.password)))
    }
    if (mode === 'signup') {
      if (!f.name.trim()) return setError('Please enter your name.')
      const p = passwordProblem(f.password)
      if (p) return setError(p)
      if (f.password !== f.confirm) return setError('The two passwords don’t match.')
      return attempt(async () => {
        const r = await signUp({ name: f.name, email: f.email, password: f.password })
        if (r.user) return done(r.user)
        setMode('sent')
        setNotice(`We’ve sent a confirmation link to ${f.email.trim()}. Open it to activate your account - your bag will be waiting.`)
        setCooldown(60)
      })
    }
    if (mode === 'forgot') {
      return attempt(async () => {
        await sendPasswordReset(f.email)
        setMode('sent')
        setNotice(`If an account exists for ${f.email.trim()}, we’ve emailed a link to set a new password.`)
        setCooldown(60)
      })
    }
    if (mode === 'code') {
      return attempt(async () => {
        await sendCode(f.email)
        setMode('code-verify')
        setCooldown(60)
      })
    }
    if (mode === 'code-verify') {
      if (!/^\d{6,8}$/.test(f.code)) return setError('Enter the code from the email.')
      return attempt(async () => done(await verifyCode(f.email, f.code)))
    }
  }

  const strength = (() => {
    const p = f.password
    let n = 0
    if (p.length >= 8) n++
    if (p.length >= 12) n++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++
    if (/\d/.test(p)) n++
    if (/[^A-Za-z0-9]/.test(p)) n++
    return n
  })()

  const input = 'h-12 w-full border-b-2 border-wine-900/30 bg-transparent text-[16px] focus:border-wine-700 focus:outline-none'
  const label = 'mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em]'
  const heading = { signin: title, signup: 'Create your account', forgot: 'Reset your password', code: 'Sign in with a code', 'code-verify': 'Check your email', sent: 'Check your email' }[mode]

  return (
    <div className="border border-gold/40 bg-cream/50 p-6 sm:p-8">
      <LotusMark className="h-9 w-9 text-gold-deep" />
      <h2 className="mt-4 font-display text-[28px] font-normal leading-tight">{heading}</h2>

      {(mode === 'signin' || mode === 'signup') && (
        <div className="mt-5 grid grid-cols-2 border-b border-wine-900/15" role="tablist">
          {[['signin', 'Sign in'], ['signup', 'Create account']].map(([m, l]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => go(m)}
              className={`-mb-px h-11 border-b-2 text-[12px] font-semibold uppercase tracking-[0.16em] ${mode === m ? 'border-wine-800 text-wine-900' : 'border-transparent text-wine-900/50 hover:text-wine-900'}`}>{l}</button>
          ))}
        </div>
      )}
      {mode === 'signin' && <p className="mt-4 text-[14.5px] leading-relaxed text-wine-900/70">{intro}</p>}
      {mode === 'forgot' && <p className="mt-2 text-[14.5px] text-wine-900/70">Enter your email and we’ll send a link to choose a new password.</p>}
      {mode === 'code' && <p className="mt-2 text-[14.5px] text-wine-900/70">We’ll email you a 6-digit code - no password needed.</p>}
      {mode === 'code-verify' && <p className="mt-2 text-[14.5px] text-wine-900/70">We sent a code to <strong className="font-semibold text-wine-900">{f.email}</strong>. Enter it below, or tap the link in the email.</p>}
      {mode === 'sent' && <p role="status" className="mt-3 text-[15px] leading-relaxed text-wine-900/80">{notice}</p>}

      {mode !== 'sent' && (
        <form onSubmit={submit} noValidate className="mt-6 space-y-5">
          {mode === 'signup' && (
            <label className="block"><span className={label}>Full name</span><input autoComplete="name" value={f.name} onChange={set('name')} className={input} /></label>
          )}
          {mode !== 'code-verify' && (
            <label className="block"><span className={label}>Email</span><input type="email" autoComplete="email" autoFocus value={f.email} onChange={set('email')} className={input} placeholder="you@example.com" /></label>
          )}
          {(mode === 'signin' || mode === 'signup') && (
            <label className="block">
              <span className={label}>Password</span>
              <span className="relative block">
                <input type={show ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={f.password} onChange={set('password')} className={`${input} pr-16`} />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-wine-900/55 hover:text-wine-900">{show ? 'Hide' : 'Show'}</button>
              </span>
              {mode === 'signup' && f.password && (
                <span className="mt-2 flex items-center gap-2" aria-live="polite">
                  <span className="flex flex-1 gap-1">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={`h-1 flex-1 ${i < strength ? (strength >= 4 ? 'bg-[#2f8a52]' : strength >= 3 ? 'bg-gold' : 'bg-wine-600') : 'bg-wine-900/10'}`} />)}</span>
                  <span className="text-[12px] text-wine-900/60">{['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength]}</span>
                </span>
              )}
            </label>
          )}
          {mode === 'signup' && (
            <label className="block"><span className={label}>Confirm password</span><input type={show ? 'text' : 'password'} autoComplete="new-password" value={f.confirm} onChange={set('confirm')} className={input} /></label>
          )}
          {mode === 'code-verify' && (
            <label className="block"><span className={label}>6-digit code</span><input inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={8} value={f.code} onChange={set('code')} className={`num ${input} tracking-[0.4em]`} placeholder="••••••" /></label>
          )}

          {error && <p role="alert" className="text-[14px] font-medium text-wine-600">{error}</p>}
          {/* wrong password OR no account yet - Supabase never says which (privacy), so offer every next step */}
          {mode === 'signin' && error.startsWith('We couldn’t sign you in') && (
            <div className="space-y-3 border border-gold/40 bg-ivory/70 p-4 text-[14px] leading-relaxed text-wine-900/80">
              <p>Check the email and password, or choose what fits:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => { go('signup'); setF((x) => ({ ...x, password: '', confirm: '' })) }} className="btn btn-wine h-11 text-[12px]">New here? Create account</button>
                <button type="button" onClick={() => go('forgot')} className="btn btn-outline-dark h-11 text-[12px]">Forgot password</button>
              </div>
              <button type="button" onClick={() => go('code')} className="link-underline text-[13px] text-wine-700">Or get a one-time sign-in code by email (works for new and existing accounts)</button>
            </div>
          )}
          {error.startsWith('Please confirm your email') && (
            <button type="button" disabled={busy || cooldown > 0} onClick={() => attempt(async () => { await resendConfirmation(f.email); setNotice('Confirmation email sent again.'); setCooldown(60) })} className="link-underline text-[13px] text-wine-700 disabled:text-wine-900/40">
              {cooldown ? `Send again in ${cooldown}s` : 'Send the confirmation email again'}
            </button>
          )}
          {notice && mode !== 'sent' && <p role="status" className="text-[13.5px] text-gold-deep">{notice}</p>}

          <button type="submit" disabled={busy} className="btn btn-wine h-12 w-full disabled:opacity-60">
            {busy ? 'Please wait…' : <>{{ signin: 'Sign in', signup: 'Create account', forgot: 'Email me a reset link', code: 'Email me a code', 'code-verify': 'Sign in' }[mode]} <IconArrow size={14} /></>}
          </button>

          <div className="flex flex-wrap justify-between gap-x-4 gap-y-2 text-[13px]">
            {mode === 'signin' && <button type="button" onClick={() => go('forgot')} className="link-underline text-wine-700">Forgot password?</button>}
            {(mode === 'signin' || mode === 'signup') && <button type="button" onClick={() => go('code')} className="link-underline text-wine-700">Email me a sign-in code instead</button>}
            {['forgot', 'code'].includes(mode) && <button type="button" onClick={() => go('signin')} className="link-underline text-wine-700">Back to sign in</button>}
            {mode === 'code-verify' && (
              <>
                <button type="button" onClick={() => go('code')} className="link-underline text-wine-700">Use a different email</button>
                <button type="button" disabled={cooldown > 0 || busy} onClick={() => attempt(async () => { await sendCode(f.email); setCooldown(60) })} className="link-underline text-wine-700 disabled:text-wine-900/40">{cooldown ? `Send again in ${cooldown}s` : 'Send a new code'}</button>
              </>
            )}
          </div>
        </form>
      )}
      {mode === 'sent' && (
        <button type="button" onClick={() => go('signin')} className="btn btn-outline-dark mt-6">Back to sign in</button>
      )}
      <p className="mt-6 text-[12px] leading-relaxed text-wine-900/55">Your account keeps your bag on every device, remembers your delivery details and lets you follow and pay for your orders.</p>
    </div>
  )
}
