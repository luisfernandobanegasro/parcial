export default function ConfirmButton({ onConfirm, children, message="¿Confirmar?", className="btn" }) {
  return (
    <button
      className={className}
      onClick={()=>{
        if(window.confirm(message)) onConfirm();
      }}
    >
      {children}
    </button>
  );
}
