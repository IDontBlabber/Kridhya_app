// Minimal line icons (1.25 stroke) drawn to match the fine-jewellery hairline aesthetic.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round' }
const Svg = ({ size = 20, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base} {...rest}>{children}</svg>
)

export const IconBag = (p) => <Svg {...p}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></Svg>
export const IconSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Svg>
export const IconUser = (p) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" /></Svg>
export const IconMenu = (p) => <Svg {...p}><path d="M3 8h18M3 16h12" /></Svg>
export const IconClose = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
export const IconArrow = (p) => <Svg {...p}><path d="M4 12h15M14 6l6 6-6 6" /></Svg>
export const IconArrowLeft = (p) => <Svg {...p}><path d="M20 12H5M10 6l-6 6 6 6" /></Svg>
export const IconChevron = (p) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
export const IconChevronDown = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
export const IconHeart = (p) => <Svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></Svg>
export const IconPlus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const IconMinus = (p) => <Svg {...p}><path d="M5 12h14" /></Svg>
export const IconPause = (p) => <Svg {...p}><path d="M9 6v12M15 6v12" /></Svg>
export const IconPlay = (p) => <Svg {...p}><path d="M8 5v14l11-7L8 5z" /></Svg>
export const IconGift = (p) => <Svg {...p}><rect x="3.5" y="9" width="17" height="11" /><path d="M2.5 9h19V6.5h-19zM12 6.5V20M12 6.5C10 3 6.5 3.5 7.5 6.5M12 6.5c2-3.5 5.5-3 4.5 0" /></Svg>
export const IconSparkle = (p) => <Svg {...p}><path d="M12 3c.6 4.5 2 6.4 6 9-4 2.6-5.4 4.5-6 9-.6-4.5-2-6.4-6-9 4-2.6 5.4-4.5 6-9z" /></Svg>
export const IconBox = (p) => <Svg {...p}><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5 12 12l9-4.5M12 12v9" /></Svg>
export const IconPen = (p) => <Svg {...p}><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" /><path d="M14 6l3 3" /></Svg>
export const IconTruck = (p) => <Svg {...p}><path d="M2.5 6h11v10h-11zM13.5 10h4l3 3v3h-7z" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></Svg>
export const IconShield = (p) => <Svg {...p}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3z" /><path d="m9 12 2 2 4-4" /></Svg>
export const IconInstagram = (p) => <Svg {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17.2" cy="6.8" r=".6" fill="currentColor" /></Svg>
export const IconFacebook = (p) => <Svg {...p}><path d="M14 8.5h2.5V5H14c-2.2 0-3.5 1.5-3.5 3.7V11H8v3.5h2.5V21H14v-6.5h2.3l.5-3.5H14V9.2c0-.5.2-.7.7-.7z" /></Svg>
export const IconFilter = (p) => <Svg {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Svg>

export const IconWhatsApp = ({ size = 22, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...p}>
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.9 9.9 0 1 0 12.04 2zm0 18.06a8.15 8.15 0 0 1-4.17-1.15l-.3-.18-3.06.89.9-2.98-.2-.31a8.17 8.17 0 1 1 6.83 3.73zm4.48-6.1c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.32-2.9c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47a.9.9 0 0 0-.66.31c-.23.25-.86.85-.86 2.07s.88 2.4 1 2.57c.13.16 1.74 2.66 4.21 3.73 1.56.68 2.18.73 2.96.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.15-1.18-.06-.1-.22-.16-.47-.29z" />
  </svg>
)
