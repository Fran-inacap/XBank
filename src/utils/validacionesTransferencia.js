export function validarMontoTransferencia(montoIngresado) {
  const montoTexto = String(montoIngresado ?? "").trim();

  if (!montoTexto) {
    return {
      valido: false,
      monto: null,
      error: "Ingresa un monto válido mayor a cero.",
    };
  }

  const monto = Number(montoTexto);

  if (!Number.isFinite(monto) || monto <= 0 || !Number.isInteger(monto)) {
    return {
      valido: false,
      monto: null,
      error: "Ingresa un monto válido mayor a cero.",
    };
  }

  return {
    valido: true,
    monto,
    error: "",
  };
}