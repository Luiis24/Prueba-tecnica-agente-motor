## Problema

La falta de organizacion y danos en un enorme archivo excel que usan para administrar polizas esta generando perdidas de 5 a 10 clientes al mes a una asesora de seguros administra una cartera de clientes.


## Solución propuesta:

Un Dashboard en el que se puedan ver todas las pólizas, filtrar, buscar y al dar click en una de estas se despliega un modal con la información de la póliza y del cliente que contrato dicha póliza.

- Sin temas de seguridad para iniciar sesion ya que extenderia la dificultad y la complejidad de la bd.

## Requerimientos: 
- Una sola pantalla principal.
- Ver las polizas que tiene que gestionar.
- Tiene que funcionar y permitir que María haga su trabajo (gestionar polizas).
- Filtro (tipo de póliza).
- Ordenar por fecha de vencimiento.
- Información del cliente (id, nombre, teléfono, doc, correo).
- Diferenciar las pólizas que estén gestionadas o no.
- Actualizar pólizas cuando son renovadas.
- Espacio para contexto sobre la póliza y lo que ofreció Maria.
- Buscador.

## Flujos

Dashboard -> ver póliza -> abre modal -> 

da estas opciones:

agrega una poliza -> llena el formulario de Agregar Nueva Póliza y guarda la poliza -> Se devuelve al modal

gestiona -> se despliega la gestion -> se llena el formulario de gestion -> se guarda y se agrega al historial

renueva -> se despliega la renovacion -> se agrega la nueva fecha de vencimiento-> se guarda -> se cambia el estado automaticamente y se agrega al historial

+ El flujo y la solución propuesta se dieron teniendo en cuenta que todo debe presentarse y poder usarse en una sola pantalla, se busca priorizar la facilidad de uso sin perder la estética ni la eficiencia.

## Base de datos planteada:

En SQLite

Tablas / Columnas

polizas / id_poliza (integer, autoincremental, llave primaria), nombre, tipo (llave foranea relacionada a tipo_poliza.id_tipo_poliza), descripcion, precio, estado (para saber si ya fue gestionada)

tipo_poliza / id_tipo_poliza (integer, autoincremental, llave primaria), nombre, descripción

clientes / id_cliente (integer, autoincremental, llave primaria), nombre, teléfono, tipo_documento, numero_documento, correo

gestiones / id_gestion (integer, autoincremental, llave primaria), id_poliza (llave foranea relacionada a polizas.id_poliza), fecha_gestion, resultado, comentario

## EndPoints:

GET,http://localhost:3000/tipos-poliza,Obtiene el listado de los tipos de póliza.
GET,http://localhost:3000/polizas,Obtiene el listado de todas las pólizas.
GET,http://localhost:3000/clientes/:id,Obtiene los datos de un cliente específico por su ID.
POST,http://localhost:3000/clientes,Crea un nuevo cliente.
POST,http://localhost:3000/polizas,Crea una nueva póliza.
POST,http://localhost:3000/gestiones,Crea una nueva gestión.
PUT,http://localhost:3000/polizas/:id,Actualiza los datos de una póliza específica por su ID.

## Trade-offs

- Inicio de sesion. 
- Alta seguridad.

+ Ambos fueron descartados por temas de tiempo y por alcance de la prueba.