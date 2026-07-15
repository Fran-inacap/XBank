import { describe, expect, it } from "vitest";
import { validarMontoTransferencia } from "../utils/validacionesTransferencia";

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