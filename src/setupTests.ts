// Importa jest-dom para agregar matchers como toBeInTheDocument()
// Esto se ejecuta automaticamente antes de cada archivo de test
import '@testing-library/jest-dom';

// === MOCKS GLOBALES ===
// Aqui mockeamos APIs del navegador que jsdom no implementa

// Definimos una propiedad 'matchMedia' en el objeto window
Object.defineProperty(window, 'matchMedia', {
  // Permitimos que se pueda sobreescribir en tests individuales
  writable: true,
  // Creamos una funcion mock que simula matchMedia del navegador
  value: jest.fn().mockImplementation(
    // Recibe un media query string como parametro
    (query) => ({
      matches: false,           // Simula que ninguna media query hace match
      media: query,             // Devuelve el query que recibio
      onchange: null,           // Handler de cambios (no usado)
      addListener: jest.fn(),   // Mock del metodo legacy addListener
      removeListener: jest.fn(),// Mock del metodo legacy removeListener
      addEventListener: jest.fn(),  // Mock de addEventListener moderno
      removeEventListener: jest.fn(), // Mock de removeEventListener
      dispatchEvent: jest.fn(), // Mock de dispatchEvent
    })
  ),
});