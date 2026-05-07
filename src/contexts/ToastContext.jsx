import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

// ── Один тост ─────────────────────────────────────────────────────────
function Toast({ toast, onRemove }) {
  const [visible, setVisible] = useState(false)
  const removeRef = useRef(onRemove)
  removeRef.current = onRemove

  // Slide-in
  useRef(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  })

  const dismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => removeRef.current(toast.id), 260)
  }, [toast.id])

  // Slide-in on mount
  useState(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  })

  return (
    <div
      style={{
        transition: 'transform 300ms ease-out, opacity 300ms ease-out',
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
      }}
      className="flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl w-72"
    >
      <span className="text-2xl shrink-0 leading-none">{toast.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold leading-tight">Достижение разблокировано!</div>
        <div className="text-sm text-gray-300 mt-0.5 truncate">{toast.name}</div>
        {toast.subtitle && (
          <div className="text-xs text-gray-400 mt-0.5">{toast.subtitle}</div>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

// ── Провайдер ─────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const showToast = useCallback((emoji, name, subtitle) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, emoji, name, subtitle }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4500)
  }, [])

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
          {toasts.map(t => (
            <Toast key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  )
}
