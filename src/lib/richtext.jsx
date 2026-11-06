import { Fragment } from 'react'
import { Link } from 'react-router-dom'

// Light formatting for journal text, written in the admin with toolbar buttons:
//   **bold**   *italic*   [link text](/shop or https://…)
// Rendered to React elements (never raw HTML), so pasted text can't inject markup.
const TOKEN = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g

export function renderInline(text = '') {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i} className="font-semibold text-wine-900">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (m) {
      const [, label, href] = m
      if (href.startsWith('/')) return <Link key={i} to={href} className="link-underline text-wine-700">{label}</Link>
      if (/^https?:\/\//.test(href)) return <a key={i} href={href} target="_blank" rel="noreferrer" className="link-underline text-wine-700">{label}</a>
      return label
    }
    // keep single line breaks typed inside a paragraph
    return part.split('\n').map((line, j, arr) => <Fragment key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</Fragment>)
  })
}

export const plainText = (text = '') => text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

export const PARA_SIZES = { sm: 'text-[14px]', md: 'text-[15px]', lg: 'font-display text-[19px] leading-[1.6] text-wine-900' }
