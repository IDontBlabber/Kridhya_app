// Fine-line mandala ornament (pure SVG, inherits `currentColor`) used as a decorative background.
// Built from rotated petal, leaf and dot rings so it stays crisp at any size and weighs almost nothing.

const ring = (count, render) => Array.from({ length: count }, (_, i) => render((360 / count) * i, i))

export default function Mandala({ className = '', strokeWidth = 0.6 }) {
  return (
    <svg viewBox="-200 -200 400 400" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
      {/* outer scalloped border */}
      {ring(48, (a) => <path key={`s${a}`} transform={`rotate(${a})`} d="M0 -196 Q 6.4 -188 0 -180 Q -6.4 -188 0 -196" />)}
      <circle r="178" />
      <circle r="172" strokeDasharray="1.5 4" />

      {/* large outer petals */}
      {ring(16, (a) => <path key={`p${a}`} transform={`rotate(${a})`} d="M0 -168 C 22 -140 22 -112 0 -96 C -22 -112 -22 -140 0 -168 Z" />)}
      {ring(16, (a) => <path key={`pi${a}`} transform={`rotate(${a})`} d="M0 -156 C 11 -138 11 -118 0 -106 C -11 -118 -11 -138 0 -156 Z" />)}
      {ring(16, (a) => <circle key={`pd${a}`} transform={`rotate(${a + 11.25})`} cx="0" cy="-150" r="2.2" />)}

      <circle r="94" />
      <circle r="89" strokeDasharray="0.8 3.2" />

      {/* lotus leaves */}
      {ring(12, (a) => <path key={`l${a}`} transform={`rotate(${a})`} d="M0 -86 C 16 -70 14 -52 0 -42 C -14 -52 -16 -70 0 -86 Z M0 -82 L0 -46" />)}
      {ring(12, (a) => <path key={`lc${a}`} transform={`rotate(${a + 15})`} d="M0 -80 C 6 -70 6 -60 0 -54 C -6 -60 -6 -70 0 -80 Z" />)}

      <circle r="40" />
      {/* inner star of interlaced loops - a nod to the infinity motif */}
      {ring(8, (a) => <ellipse key={`e${a}`} transform={`rotate(${a})`} cx="0" cy="-22" rx="7" ry="16" />)}
      <circle r="9" />
      <circle r="3.5" />
    </svg>
  )
}
