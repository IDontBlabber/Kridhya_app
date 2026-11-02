import { Link } from 'react-router-dom'
import { LogoStacked } from '../components/Logo'
import useDocumentMeta from '../hooks/useDocumentMeta'

export default function NotFound() {
  useDocumentMeta('Page not found | Kridhya by Devanshi Agarwal')
  return (
    <section className="grain relative flex min-h-[90svh] items-center bg-wine-900 text-ivory">
      <div className="container-site text-center">
        <LogoStacked withTagline className="mx-auto" />
        <h1 className="h-display mt-6">This page has wandered off.</h1>
        <p className="mx-auto mt-6 max-w-md text-ivory/75">The page you’re looking for doesn’t exist or has moved.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/" className="btn btn-gold">Return home</Link>
          <Link to="/shop" className="btn btn-outline-light">Shop the collection</Link>
        </div>
      </div>
    </section>
  )
}
