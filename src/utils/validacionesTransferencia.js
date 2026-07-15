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

export function validarTransferencia({ montoIngresado, saldoDisponible, destinatarioEmail, usuarioEmail }) {
  const validacionMonto = validarMontoTransferencia(montoIngresado);

  if (!validacionMonto.valido) {
    return validacionMonto;
  }

  const monto = validacionMonto.monto;
  const destinatarioTexto = String(destinatarioEmail ?? "").trim();
  const usuarioTexto = String(usuarioEmail ?? "").trim();
  const saldoNumero = Number(saldoDisponible);
  const patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!destinatarioTexto || !patronEmail.test(destinatarioTexto)) {
    return {
      valido: false,
      monto: null,
      error: "Selecciona un destinatario válido para transferir.",
    };
  }

  if (destinatarioTexto === usuarioTexto) {
    return {
      valido: false,
      monto: null,
      error: "No puedes transferirte dinero a ti mismo.",
    };
  }

  if (!Number.isFinite(saldoNumero) || monto > saldoNumero) {
    return {
      valido: false,
      monto: null,
      error: "No tienes saldo suficiente para realizar esta transferencia.",
    };
  }

  return {
    valido: true,
    monto,
    error: "",
  };
}