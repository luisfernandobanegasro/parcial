import { Modal } from "bootstrap";
import { useEffect, useRef } from "react";

export default function ModalForm({ open, onClose, title, children, footer }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = new Modal(el, { backdrop: "static" });
    open ? m.show() : m.hide();
    el.addEventListener("hidden.bs.modal", onClose);
    return () => el.removeEventListener("hidden.bs.modal", onClose);
  }, [open, onClose]);

  return (
    <div className="modal fade" tabIndex="-1" ref={ref}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">{footer}</div>
        </div>
      </div>
    </div>
  );
}
