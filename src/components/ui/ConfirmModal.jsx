import Modal from './Modal'

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Удалить' }) {
  if (!open) return null

  const handleConfirm = () => { onConfirm(); onClose() }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-5">
        {message && (
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        )}
        <div className="flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all duration-200 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
