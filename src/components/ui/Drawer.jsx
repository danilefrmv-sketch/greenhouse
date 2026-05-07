import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useIsMobile } from '../../hooks/useIsMobile'

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

/**
 * Универсальный drawer:
 * — Desktop (≥768px): выезжает справа
 * — Mobile (<768px): всплывает снизу (bottom sheet)
 *
 * Автоматически:
 *   - скроллит к сфокусированному полю при открытии клавиатуры
 *   - прижимается к visual viewport (не перекрывается клавиатурой)
 *
 * Props:
 *   open, onClose, title, subtitle?,
 *   headerRight?   — слот справа от заголовка
 *   customHeader?  — полностью заменяет стандартный header
 *   subheader?     — между header и контентом, не скроллится
 *   footer?        — нижняя панель
 *   children       — скроллируемый контент
 *   width?         — ширина на desktop (default 450)
 */
export default function Drawer({
  open, onClose,
  title, subtitle,
  headerRight,
  customHeader,
  subheader,
  footer,
  children,
  width = 450,
}) {
  const isMobile  = useIsMobile()
  const [visible, setVisible] = useState(false)

  // Visual viewport tracking — чтобы bottom sheet не перекрывался клавиатурой
  const [vvOffset, setVvOffset] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
      return () => cancelAnimationFrame(raf)
    } else {
      setVisible(false)
      document.body.style.overflow = ''
      setVvOffset(0)
    }
  }, [open])

  // Следим за visual viewport (клавиатура на мобильном)
  useEffect(() => {
    if (!isMobile || !open) return
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      // Смещение снизу = разница между innerHeight и нижней границей visual viewport
      const offset = window.innerHeight - (vv.offsetTop + vv.height)
      setVvOffset(Math.max(0, offset))
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [isMobile, open])

  // Скроллим к полю при фокусе внутри scrollRef
  const handleScrollAreaFocus = (e) => {
    const target = e.target
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') return
    // Небольшая задержка — ждём пока клавиатура поднимется
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 320)
  }

  const backdropStyle = {
    transition: 'opacity 300ms ease',
    opacity: visible ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
  }

  const header = customHeader ?? (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-gray-900 truncate">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-3">
        {headerRight}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return createPortal(
      <>
        <div onClick={onClose} className="fixed inset-0 z-40 bg-black/30" style={backdropStyle} />
        <div
          className="fixed left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
          style={{
            bottom: vvOffset,
            height: `calc(92dvh - ${vvOffset}px)`,
            transition: visible
              ? `transform 380ms cubic-bezier(0.16, 1, 0.3, 1), bottom 200ms ease, height 200ms ease`
              : 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1)',
            transform: visible ? 'translateY(0)' : 'translateY(100%)',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          {header}
          {subheader}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain"
            onFocus={handleScrollAreaFocus}
          >
            {children}
          </div>
          {footer && (
            <div
              className="shrink-0 border-t border-gray-100 px-6 py-4"
              style={{ paddingBottom: vvOffset > 0 ? '1rem' : 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              {footer}
            </div>
          )}
        </div>
      </>,
      document.body
    )
  }

  // Desktop
  return createPortal(
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/20" style={backdropStyle} />
      <div
        className="fixed right-0 top-0 z-50 h-full bg-white shadow-2xl flex flex-col"
        style={{
          width,
          transition: 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1)',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {header}
        {subheader}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onFocus={handleScrollAreaFocus}
        >
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-gray-100 px-6 py-4">{footer}</div>
        )}
      </div>
    </>,
    document.body
  )
}
