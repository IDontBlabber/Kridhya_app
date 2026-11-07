import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InfoHero } from '../components/InfoPage'
import { IconArrow } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { passwordProblem, setNewPassword } from '../lib/auth'
import useDocumentMeta from '../hooks/useDocumentMeta'

// Arrived from the "reset your password" email: Supabase signs the visitor in for recovery; they choose a new password.
export default function ResetPassword() {
  useDocumentMeta('Set a new password | Kridhya by Devanshi Agarwal')
  const { user, ready, ensure } = useAuth()
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { ensure() }, [ensure]) // loads auth, which signs the visitor in from the link in the URL

  const submit = async (e) => {
    e.preventDefault()
    const p = passwordProblem(pw)
    if (p) return setError(p)
    if (pw !== confirm) return setError('The two passwords do not match.')
    setBusy(true)
    setError('')
    try {
      await setNewPassword(pw)
      setDone(true)
      setTimeout(() => navigate('/account'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input = 'h-12 w-full border-b-2 border-wine-900/30 bg-transparent text-[16px] focus:border-wine-700 focus:outline-none'
  return (
    <>
      <InfoHero eyebrow="My account" title="Set a new password" />
      <section className="section bg-ivory">
        <div className="container-site max-w-md">
          {!ready ? (
            <p className="text-[15px] text-wine-900/60">One moment…</p>
          ) : !user ? (
            <p className="text-[15px] text-wine-900/70">This reset link has expired or was already used. <Link to="/account" className="link-underline text-wine-700">Request a new one</Link> from the sign-in page (“Forgot password?”).</p>
          ) : done ? (
            <p role="status" className="text-[15px] text-wine-900/80">Your password has been changed. Taking you to your account…</p>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-5 border border-gold/40 bg-cream/50 p-6 sm:p-8">
              <p className="text-[14.5px] text-wine-900/70">Choose a new password for {user.email}.</p>
              <label className="block"><span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em]">New password</span><input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={input} /></label>
              <label className="block"><span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em]">Confirm password</span><input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} /></label>
              {error && <p role="alert" className="text-[14px] font-medium text-wine-600">{error}</p>}
              <button type="submit" disabled={busy} className="btn btn-wine h-12 w-full disabled:opacity-60">{busy ? 'Saving…' : <>Save new password <IconArrow size={14} /></>}</button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
