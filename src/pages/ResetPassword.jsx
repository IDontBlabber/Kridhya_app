import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InfoHero } from '../components/InfoPage'
import { IconArrow } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { getUser, linkFromUrl, passwordProblem, sendPasswordReset, setNewPassword, verifyEmailLink } from '../lib/auth'
import useDocumentMeta from '../hooks/useDocumentMeta'

// Arrived from the "reset your password" email. The link carries a one-time token (token_hash) which is checked
// here, so it works in any browser or device. Expired / used links can be replaced on the spot.
export default function ResetPassword() {
  useDocumentMeta('Set a new password | Kridhya by Devanshi Agarwal')
  const { ensure, setUser } = useAuth()
  const navigate = useNavigate()
  const [phase, setPhase] = useState('checking') // checking | form | expired | done
  const [reason, setReason] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    let live = true
    ;(async () => {
      await ensure()
      const link = linkFromUrl()
      try {
        if (link.tokenHash && link.type === 'recovery') {
          const u = await verifyEmailLink(link.tokenHash, 'recovery')
          if (!live) return
          setUser(u)
          setEmail(u?.email || '')
          return setPhase('form')
        }
        if (link.errorCode) throw new Error(link.errorCode === 'otp_expired' ? 'This link has expired or was already used.' : link.errorText || 'This link is not valid.')
        // older-style link (opened in the same browser): the session is set up automatically
        const u = await getUser()
        if (!live) return
        if (u) {
          setEmail(u.email || '')
          return setPhase('form')
        }
        throw new Error('This link has expired or was already used.')
      } catch (e) {
        if (!live) return
        setReason(e.message)
        setPhase('expired')
      }
    })()
    return () => { live = false }
  }, [ensure, setUser])

  const save = async (e) => {
    e.preventDefault()
    const p = passwordProblem(pw)
    if (p) return setError(p)
    if (pw !== confirm) return setError('The two passwords do not match.')
    setBusy(true)
    setError('')
    try {
      await setNewPassword(pw)
      setPhase('done')
      setTimeout(() => navigate('/account'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const resend = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email address.')
    setBusy(true)
    setError('')
    try {
      await sendPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input = 'h-12 w-full border-b-2 border-wine-900/30 bg-transparent text-[16px] focus:border-wine-700 focus:outline-none'
  const label = 'mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em]'
  return (
    <>
      <InfoHero eyebrow="My account" title="Set a new password" />
      <section className="section bg-ivory">
        <div className="container-site max-w-md">
          {phase === 'checking' && <p className="text-[15px] text-wine-900/60">Checking your link…</p>}

          {phase === 'done' && <p role="status" className="text-[15px] text-wine-900/80">Your password has been changed. Taking you to your account…</p>}

          {phase === 'form' && (
            <form onSubmit={save} noValidate className="space-y-5 border border-gold/40 bg-cream/50 p-6 sm:p-8">
              <p className="text-[14.5px] text-wine-900/70">Choose a new password{email ? ` for ${email}` : ''}.</p>
              <label className="block"><span className={label}>New password</span><input type="password" autoComplete="new-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} className={input} /></label>
              <label className="block"><span className={label}>Confirm password</span><input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} /></label>
              <p className="text-[12.5px] text-wine-900/55">At least 8 characters, with letters and numbers.</p>
              {error && <p role="alert" className="text-[14px] font-medium text-wine-600">{error}</p>}
              <button type="submit" disabled={busy} className="btn btn-wine h-12 w-full disabled:opacity-60">{busy ? 'Saving…' : <>Save new password <IconArrow size={14} /></>}</button>
            </form>
          )}

          {phase === 'expired' && (
            <div className="space-y-5 border border-gold/40 bg-cream/50 p-6 sm:p-8">
              <p className="text-[15px] text-wine-900/80">{reason} Reset links work once and expire after a while - here’s a fresh one.</p>
              {sent ? (
                <p role="status" className="text-[15px] font-medium text-gold-deep">If an account exists for {email}, a new link is on its way. Open the newest email.</p>
              ) : (
                <form onSubmit={resend} noValidate className="space-y-5">
                  <label className="block"><span className={label}>Your email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
                  {error && <p role="alert" className="text-[14px] font-medium text-wine-600">{error}</p>}
                  <button type="submit" disabled={busy} className="btn btn-wine h-12 w-full disabled:opacity-60">{busy ? 'Sending…' : <>Email me a new link <IconArrow size={14} /></>}</button>
                </form>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
