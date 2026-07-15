import { describe, expect, it } from "vitest";
import { validarMontoTransferencia, validarTransferencia } from "./validacionesTransferencia";

describe("validarMontoTransferencia", () => {
  it.each([
    ["rechaza transferencias con monto negativo", "-10"],
    ["rechaza transferencias con monto cero", "0"],
    ["rechaza transferencias con monto no numérico", "abc"],
    ["rechaza transferencias con decimales inválidos", "10.5"],
  ])("%s", (_descripcion, montoIngresado) => {
    const resultado = validarMontoTransferencia(montoIngresado);

    expect(resultado.valido).toBe(false);
    expect(resultado.monto).toBeNull();
    expect(resultado.error).toBe("Ingresa un monto válido mayor a cero.");
  });
});

describe("validarTransferencia", () => {
  it.each([
    [
      "rechaza transferencias con monto mayor al saldo disponible",
      {
        montoIngresado: "1500",
        saldoDisponible: 1000,
        destinatarioEmail: "destino@correo.com",
        usuarioEmail: "origen@correo.com",
      },
      false,
      null,
      "No tienes saldo suficiente para realizar esta transferencia.",
    ],
    [
      "rechaza transferencias a uno mismo",
      {
        montoIngresado: "500",
        saldoDisponible: 1000,
        destinatarioEmail: "mismo@correo.com",
        usuarioEmail: "mismo@correo.com",
      },
      false,
      null,
      "No puedes transferirte dinero a ti mismo.",
    ],
    [
      "rechaza transferencias con destinatario vacío",
      {
        montoIngresado: "500",
        saldoDisponible: 1000,
        destinatarioEmail: "",
        usuarioEmail: "origen@correo.com",
      },
      false,
      null,
      "Selecciona un destinatario válido para transferir.",
    ],
    [
      "rechaza transferencias con destinatario con formato inválido",
      {
        montoIngresado: "500",
        saldoDisponible: 1000,
        destinatarioEmail: "destino-invalido",
        usuarioEmail: "origen@correo.com",
      },
      false,
      null,
      "Selecciona un destinatario válido para transferir.",
    ],
    [
      "acepta transferencias con monto válido y saldo suficiente",
      {
        montoIngresado: "500",
        saldoDisponible: 1000,
        destinatarioEmail: "destino@correo.com",
        usuarioEmail: "origen@correo.com",
      },
      true,
      500,
      "",
    ],
  ])("%s", (_descripcion, entrada, valorEsperado, montoEsperado, errorEsperado) => {
    const resultado = validarTransferencia(entrada);

    expect(resultado.valido).toBe(valorEsperado);
    expect(resultado.monto).toBe(montoEsperado);
    expect(resultado.error).toBe(errorEsperado);
  });
});