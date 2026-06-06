## Casos críticos testeados:

## Test 1: Renovación de póliza 🔄

Por qué es crítico: Es la funcionalidad principal del sistema

+ Valida: Actualización de fecha + cambio de estado a gestionada

- Riesgo: Que no se actualice correctamente el estado


## Test 2: Creación de cliente con póliza 👤

Por qué es crítico: Flujo completo de registro

+ Valida: Creación de cliente + asociación de póliza

- Riesgo: Datos inconsistentes o pérdida de relación


## Test 3: Registro de gestión con correo ✉️

Por qué es crítico: Trazabilidad de comunicaciones

+ Valida: Registro CORREO_ENVIADO + historial

- Riesgo: No persistir el seguimiento comercial


## Características de los tests:

+ No requieren instalación adicional (solo Node.js y navegador)

+ Testean comportamientos reales (llamadas API reales)

+ Logs detallados de cada paso

+ Visualización clara de resultados

+ Se pueden ejecutar individualmente o todos juntos

+ Resumen automático de resultados