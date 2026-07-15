// Importamos el tipo Config de Jest para tener autocompletado
import type { Config } from 'jest';

// Definimos el objeto de configuracion con tipado
const config: Config = {
  // Usamos jsdom para simular un navegador en los tests
  testEnvironment: 'jsdom',
  // Archivo que se ejecuta DESPUES de configurar el entorno de test
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts'
  ],
  // Mapeo de modulos: reemplaza imports de CSS por un objeto vacio
  moduleNameMapper: {
    // Cuando un archivo importa .css/.less/.scss, usa un proxy vacio
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    // Permite usar alias @/ para apuntar a src/
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Define como transformar archivos antes de ejecutar tests
  transform: {
    // Usa ts-jest para compilar archivos .ts y .tsx
    '^.+\\.tsx?$': 'ts-jest',
  },
  // Umbrales minimos de cobertura (el CI falla si no se cumplen)
  coverageThreshold: {
    global: {
      branches: 80,   // 80% de ramas if/else cubiertas
      functions: 80,  // 80% de funciones ejecutadas
      lines: 80,      // 80% de lineas ejecutadas
      statements: 80, // 80% de sentencias ejecutadas
    },
  },
};

// Exportamos la configuracion para que Jest la use
export default config;