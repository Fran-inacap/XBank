export default function Historial({
  mostrarHistorial,
  onToggle,
  movimientosCargando,
  movimientosError,
  movimientos,
  movimientosFiltrados,
  filtroTipo,
  onFiltroTipoChange,
  filtroMes,
  onFiltroMesChange,
  filtroContraparte,
  onFiltroContraparteChange,
  opcionesMeses,
  opcionesContraparte,
  formatearFechaHora,
  formatearSaldo,
  obtenerContraparte,
  esMovimientoNegativo,
}) {
  return (
    <div className="history-card">
      <div className="transfer-header">
        <h2>Movimientos</h2>
        <button type="button" className="secondary-btn" onClick={onToggle}>
          {mostrarHistorial ? "Ocultar movimientos" : "Ver movimientos"}
        </button>
      </div>

      {mostrarHistorial && (
        <div className="history-content">
          {movimientosCargando ? (
            <p className="transfer-empty">Cargando historial...</p>
          ) : movimientosError ? (
            <p className="feedback feedback-error">{movimientosError}</p>
          ) : movimientos.length === 0 ? (
            <p className="transfer-empty">No hay movimientos registrados todavía.</p>
          ) : (
            <>
              <div className="history-filters">
                <label className="filter-field">
                  Tipo
                  <select value={filtroTipo} onChange={(event) => onFiltroTipoChange(event.target.value)}>
                    <option value="todos">Todos</option>
                    <option value="envio">Envío</option>
                    <option value="recepcion">Recepción</option>
                    <option value="deposito">Depósito</option>
                    <option value="retiro">Retiro</option>
                  </select>
                </label>

                <label className="filter-field">
                  Mes
                  <select value={filtroMes} onChange={(event) => onFiltroMesChange(event.target.value)}>
                    <option value="todos">Todos</option>
                    {opcionesMeses.map((mes) => (
                      <option key={mes.value} value={mes.value}>
                        {mes.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-field">
                  Contraparte
                  <select value={filtroContraparte} onChange={(event) => onFiltroContraparteChange(event.target.value)}>
                    <option value="todos">Todas</option>
                    {opcionesContraparte.map((contraparte) => (
                      <option key={contraparte} value={contraparte}>
                        {contraparte}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {movimientosFiltrados.length === 0 ? (
                <p className="transfer-empty">No hay movimientos con esos filtros.</p>
              ) : (
                <ul className="history-list">
                  {movimientosFiltrados.map((movimiento) => {
                    const esEnvio = esMovimientoNegativo(movimiento);

                    return (
                      <li key={movimiento.id} className="history-item">
                        <div>
                          <p className="history-title">
                            {esEnvio ? "Envío" : "Recepción"} · {obtenerContraparte(movimiento)}
                          </p>
                          <p className="history-meta">
                            {formatearFechaHora(movimiento.fecha)} · {movimiento.descripcion || "Sin descripción"}
                          </p>
                        </div>
                        <p className={`history-amount ${esEnvio ? "negative" : "positive"}`}>
                          {esEnvio ? "-" : "+"}
                          {formatearSaldo(movimiento.monto)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}