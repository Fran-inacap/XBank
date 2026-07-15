import { describe, expect, it } from "vitest";
import { validarMontoTransferencia, validarTransferencia } from "../utils/validacionesTransferencia";

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
  it("rechaza transferencias con monto mayor al saldo disponible", () => {
    const resultado = validarTransferencia({
      montoIngresado: "1500",
      saldoDisponible: 1000,
      destinatarioEmail: "destino@correo.com",
      usuarioEmail: "origen@correo.com",
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.monto).toBeNull();
    expect(resultado.error).toBe("No tienes saldo suficiente para realizar esta transferencia.");
  });

  it("acepta transferencias con monto válido y saldo suficiente", () => {
    const resultado = validarTransferencia({
      montoIngresado: "500",
      saldoDisponible: 1000,
      destinatarioEmail: "destino@correo.com",
      usuarioEmail: "origen@correo.com",
    });

    expect(resultado.valido).toBe(true);
    expect(resultado.monto).toBe(500);
    expect(resultado.error).toBe("");
  });

  it("rechaza transferencias a uno mismo", () => {
    const resultado = validarTransferencia({
      montoIngresado: "500",
      saldoDisponible: 1000,
      destinatarioEmail: "mismo@correo.com",
      usuarioEmail: "mismo@correo.com",
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.monto).toBeNull();
    expect(resultado.error).toBe("No puedes transferirte dinero a ti mismo.");
  });

  it.each([
    ["rechaza transferencias con destinatario vacío", ""],
    ["rechaza transferencias con destinatario con formato inválido", "destino-invalido"],
  ])("%s", (_descripcion, destinatarioEmail) => {
    const resultado = validarTransferencia({
      montoIngresado: "500",
      saldoDisponible: 1000,
      destinatarioEmail,
      usuarioEmail: "origen@correo.com",
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.monto).toBeNull();
    expect(resultado.error).toBe("Selecciona un destinatario válido para transferir.");
  });
});