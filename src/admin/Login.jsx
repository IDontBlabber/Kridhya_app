import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import Logo, { BRAND, LogoStacked } from '../components/Logo'
import Mandala from '../components/Mandala'
import { isConfigured, signIn, usesEmail } from './auth'

export default function Login({ onSignedIn }) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!user.trim() || !password) return setError(`Enter your ${usesEmail ? 'email' : 'username'} and password.`)
    setBusy(true)
    setError('')
    const res = await signIn(user, password, remember)
    setBusy(false)
    if (res.error) {
      setError(res.error)
      setPassword('')
    } else onSignedIn(res.session)
  }

  return (
    <div className="grid min-h-screen font-sans lg:grid-cols-2">
      {/* brand panel */}
      <div className="grain relative isolate hidden overflow-hidden bg-wine-900 text-ivory lg:flex lg:flex-col lg:items-center lg:justify-center">
        <img src="/images/generated/satin-wine-gold.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-wine-950/70 to-wine-900/90" />
        <Mandala className="pointer-events-none absolute -bottom-48 -left-48 -z-10 h-[640px] w-[640px] text-gold/[0.12]" />
        <LogoStacked withTagline />
        <p className="absolute bottom-8 text-[12px] uppercase tracking-[0.26em] text-ivory/45">Admin portal</p>
      </div>

      {/* form */}
      <div className="flex flex-col bg-ivory px-6 py-8 text-wine-900 sm:px-10">
        <div className="flex items-center justify-between">
          <span className="text-wine-900 lg:invisible"><Logo /></span>
          <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-wine-900/60 hover:text-wine-900"><ArrowLeft size={14} /> Back to website</Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <p className="eyebrow text-gold-deep">{BRAND.name}</p>
          <h1 className="mt-3 font-display text-[32px] font-normal leading-tight">Admin portal</h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-wine-900/65">Sign in to manage products, stock and the journal.</p>

          <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold">{usesEmail ? 'Email' : 'Username'}</span>
              <input type={usesEmail ? 'email' : 'text'} value={user} onChange={(e) => setUser(e.target.value)} autoComplete={usesEmail ? 'email' : 'username'} autoCapitalize="none" spellCheck={false} autoFocus className="h-12 w-full border border-wine-900/20 bg-white px-3.5 text-[15px] focus:border-wine-700 focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold">Password</span>
              <span className="relative block">
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="h-12 w-full border border-wine-900/20 bg-white pl-3.5 pr-12 text-[15px] focus:border-wine-700 focus:outline-none focus:ring-2 focus:ring-gold/30" />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded text-wine-900/55 hover:text-wine-900">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {!usesEmail && <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-wine-900/75">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-wine-800" />
              Keep me signed in on this device
            </label>}
            {error && <p role="alert" className=" bg-[#f8e3e6] px-3 py-2.5 text-[13.5px] font-medium text-[#9b2335]">{error}</p>}
            {!isConfigured() && !error && <p className=" bg-[#fbf0d9] px-3 py-2.5 text-[13px] text-[#8a5a00]">Login is not set up on this build yet.</p>}
            <button type="submit" disabled={busy} className="btn btn-wine h-12 w-full disabled:opacity-60">
              <LockKeyhole size={16} /> {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-wine-900/45">{BRAND.tagline}</p>
      </div>
    </div>
  )
}
