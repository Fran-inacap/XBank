import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// === MOCKS GLOBALES ===
// Aqui mockeamos APIs del navegador que jsdom no implementa

// Definimos una propiedad 'matchMedia' en el objeto window
Object.defineProperty(window, 'matchMedia', {
  // Permitimos que se pueda sobreescribir en tests individuales
  writable: true,
  // Creamos una funcion mock que simula matchMedia del navegador
  value: vi.fn().mockImplementation(
    // Recibe un media query string como parametro
    (query) => ({
      matches: false,           // Simula que ninguna media query hace match
      media: query,             // Devuelve el query que recibio
      onchange: null,           // Handler de cambios (no usado)
      addListener: vi.fn(),   // Mock del metodo legacy addListener
      removeListener: vi.fn(),// Mock del metodo legacy removeListener
      addEventListener: vi.fn(),  // Mock de addEventListener moderno
      removeEventListener: vi.fn(), // Mock de removeEventListener
      dispatchEvent: vi.fn(), // Mock de dispatchEvent
    })
  ),
});

afterEach(() => {
  cleanup();
});