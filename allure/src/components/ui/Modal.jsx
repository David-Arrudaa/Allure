import { X } from "lucide-react";
import { MODAL_STYLES } from "../../config/theme";

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;

  return (
    <div
      className={MODAL_STYLES.overlay}
      onClick={onClose}
    >
      <div
        className={`${MODAL_STYLES.container} ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={MODAL_STYLES.header}>
          {title && <h2 className={MODAL_STYLES.title}>{title}</h2>}
          <button
            onClick={onClose}
            className={MODAL_STYLES.closeButton}
            type="button"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className={MODAL_STYLES.body}>
          {children}
        </div>
      </div>
    </div>
  );
}
