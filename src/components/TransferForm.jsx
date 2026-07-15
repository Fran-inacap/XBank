export default function TransferForm({
  usuariosDisponibles,
  mostrarFormularioTransferencia,
  destinatarioId,
  onToggle,
  onDestinatarioChange,
  montoTransferencia,
  onMontoChange,
  descripcionTransferencia,
  onDescripcionChange,
  transferenciaProcesando,
  transferenciaError,
  transferenciaExito,
  onSubmit,
}) {
  return (
    <div className="transfer-card">
      <div className="transfer-header">
        <h2>Transferir dinero</h2>
        <button type="button" className="secondary-btn" onClick={onToggle}>
          {mostrarFormularioTransferencia ? "Ocultar" : "Transferir"}
        </button>
      </div>

      {mostrarFormularioTransferencia && (
        <form className="transfer-form" onSubmit={onSubmit}>
          <label className="transfer-field">
            Destinatario
            {usuariosDisponibles.length > 0 ? (
              <select value={destinatarioId} onChange={(event) => onDestinatarioChange(event.target.value)}>
                <option value="">Selecciona un usuario</option>
                {usuariosDisponibles.map((usuarioDisponible) => (
                  <option key={usuarioDisponible.id} value={usuarioDisponible.id}>
                    {usuarioDisponible.nombre} ({usuarioDisponible.email})
                  </option>
                ))}
              </select>
            ) : (
              <p className="transfer-empty">No hay otros usuarios disponibles para transferir.</p>
            )}
          </label>

          <label className="transfer-field">
            Monto
            <input
              type="number"
              min="1"
              step="1"
              value={montoTransferencia}
              onChange={(event) => onMontoChange(event.target.value)}
              placeholder="10000"
            />
          </label>

          <label className="transfer-field">
            Descripción
            <input
              type="text"
              value={descripcionTransferencia}
              onChange={(event) => onDescripcionChange(event.target.value)}
              placeholder="Pago por servicios"
            />
          </label>

          <div className="transfer-actions">
            <button type="submit" disabled={transferenciaProcesando || !destinatarioId || !montoTransferencia}>
              {transferenciaProcesando ? "Procesando..." : "Confirmar transferencia"}
            </button>
          </div>

          {transferenciaError && <p className="feedback feedback-error">{transferenciaError}</p>}
          {transferenciaExito && <p className="feedback">{transferenciaExito}</p>}
        </form>
      )}
    </div>
  );
}