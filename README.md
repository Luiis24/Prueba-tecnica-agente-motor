# Gestión de Pólizas

## 1. Cómo correrlo

### Requisitos previos

* Node.js instalado.

### Windows

1. Abrir una terminal en `src\backend` y ejecutar:

```bash
npm install
```

2. Iniciar el servidor:

```bash
node server.js
```

Debe mostrarse:

Servidor corriendo en puerto 3000


3. Abrir el archivo:
En la ruta:

src\frontend\index.html


La aplicación quedará disponible para su uso.

### Linux / macOS

1. Abrir una terminal en `src/backend`.

2. Ejecutar:

```bash
npm install
```

3. Iniciar el servidor:

```bash
node server.js
```

4. Abrir el archivo:

```text
src/frontend/index.html
```

---

## 2. Decisiones de diseño que tomé y por qué

* Se utilizó Node.js con Express para el backend debido a su simplicidad y rapidez para exponer APIs REST.
* Se utilizó HTML, CSS y JavaScript puro en el frontend para minimizar dependencias y facilitar la ejecución de la prueba.
* Los datos se almacenan en la base de datos en SQLite mediante consultas ejecitadas con JavaScript y node.
* Se separó el proyecto en carpetas de frontend y backend para mantener una estructura organizada y facilitar futuras ampliaciones.
* Se implementaron validaciones básicas tanto en frontend como en backend para garantizar la integridad de la información ingresada.
* Se usaron los colores de la empresa sacados de su pagina https://www.agentemotor.com/ y se intento seguir su estetica.

## 3. Qué dejé fuera y por qué

* Sistema de autenticación y autorización. Teniendo en cuenta que se especifica que el sistema es para una sola persona en este caso maria y pues teniendo en cuenta el tiempo no lo considere necesario.
* Manejo avanzado de errores y registro centralizado de logs.

Estas funcionalidades son importantes en entornos reales, pero excedían el alcance de la prueba técnica.

## 4. Si esto fuera a producción mañana, qué le falta

* Sistema de autenticación y gestión de roles.
* Validaciones más robustas.
* Monitoreo y observabilidad.
* Manejo centralizado de errores.
* Despliegue automatizado mediante CI/CD.
* Contenerización con Docker y orquestación según necesidades del entorno.

## 5. Tiempo aproximado que me tomó

No estoy 100% seguro del tiempo exacto, el análisis lo hice el dia 03/06/2026 y me tomo al rededor de 40 Minutos

El desarrollo de la base datos con ayuda de la IA tomo unos 30 Minutos

El backend me tomo al rededor de 40 minutos con las peticiones listas y probadas con postman.

El consumo del backend 10 minutos.

El desarrollo de las peticiones post y put, junto con demas funcionalidades como filtros, busqueda, modal y cumplimiento del flujo planteado tomo unas 3 horas aproximadamente

Los test tomaron 30 minutos con ayuda de la IA.

La documentacion 1 hora.

6 Horas y 30 minutos aproximadmente 

## 6. Qué mejoraría de esta prueba técnica

Incluiría un conjunto de datos de ejemplo. Esto permitiría enfocar más tiempo en la calidad de la implementación y menos en la interpretación de ciertos comportamientos esperados.

## Reflexión



## Video


