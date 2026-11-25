# Plan de Pruebas Unitarias e Integración — Sistema de Gestión Atlas

**Proyecto:** Sistema de Gestión Atlas (RDTmc/atlas-sg)  
**Sigla:** ISY1102 — Seguridad y Calidad en el Desarrollo de Software  
**Experiencia de Aprendizaje:** EA3  
**Fecha:** 24 de noviembre de 2026

---

## 1. Propósito

Este plan define las pruebas unitarias y de integración que deben ejecutarse sobre el repositorio real del Sistema de Gestión Atlas. Las pruebas fueron desarrolladas siguiendo la metodología de las guías 3.1.2 a 3.4.2 (Experiencia 3) y aplicadas al stack real (Node.js/Express + React 19 + PostgreSQL).

---

## 2. Pruebas Unitarias (5 pruebas)

Las pruebas unitarias verifican funciones aisladas del backend sin depender de la base de datos real. Se utiliza **mocking** del pool de PostgreSQL.

| ID | Nombre | Módulo probado | Descripción | Criterio de aceptación |
|----|--------|----------------|-------------|------------------------|
| **UT-01** | Validación de contraseña en texto plano | `auth.js` | Verificar que el login compara la contraseña directamente sin hashing (vulnerabilidad INC-001) | La función debe retornar `true` cuando `contrasena_hash === password` |
| **UT-02** | Generación de JWT con secreto hardcodeado | `auth.js` | Verificar que JWT se firma con `JWT_SECRET` que tiene fallback "inseguro" (INC-002) | El token JWT debe generarse usando el secreto por defecto cuando no hay variable de entorno |
| **UT-03** | Endpoint de login en ruta incorrecta | `app.js` | Verificar que el endpoint de login está en `/autenticacion/login` y no en `/api/auth/login` (INC-003) | La ruta registrada debe ser `/autenticacion` |
| **UT-04** | Exposición de errores internos | `auth.js` | Verificar que los mensajes de error incluyen `err.message` expuesto al cliente (INC-005) | La respuesta de error debe incluir `glosa: err.message` |
| **UT-05** | Retraso artificial en login (DoS) | `auth.js` | Verificar que existe un `delay(4000)` en el login que permite ataque de denegación de servicio (INC-006) | El código debe contener `await delay(4000)` antes de procesar el login |

---

## 3. Pruebas de Integración (5 pruebas)

Las pruebas de integración verifican el flujo completo contra la base de datos PostgreSQL real en ejecución (Docker, puerto 15432).

| ID | Nombre | Endpoint probado | Descripción | Criterio de aceptación |
|----|--------|------------------|-------------|------------------------|
| **IT-01** | Login con credenciales válidas | POST `/autenticacion/login` | Autenticar usuario `admin` con password `admin` | Respuesta 200 con token JWT válido |
| **IT-02** | Login con credenciales inválidas | POST `/autenticacion/login` | Autenticar con password incorrecto | Respuesta 401 con mensaje "Credenciales inválidas" |
| **IT-03** | Crear cliente autenticado | POST `/clientes` | Crear un cliente con token JWT válido | Respuesta 201 con los datos del cliente creado |
| **IT-04** | Listar clientes sin token | GET `/clientes` | Intentar listar clientes sin autenticación | Respuesta 401 "No autorizado" |
| **IT-05** | Crear contrato con archivo | POST `/contratos` | Crear contrato con archivo PDF adjunto | Respuesta 201 con contrato creado y documento guardado |

---

## 4. Configuración de Ejecución

- **Entorno:** Base de datos PostgreSQL en Docker (puerto 15432), Backend en ejecución (puerto 4450)
- **Framework de pruebas:** Jest + Supertest
- **Comando de ejecución:** `npm test` (desde `BACKEND/`)
- **Archivo de configuración:** `jest.config.js` en `BACKEND/`

---

## 5. Métricas de Éxito

- **Pruebas unitarias:** 5/5 ejecutadas y pasando (o fallando como esperado para demostrar vulnerabilidades)
- **Pruebas de integración:** 5/5 ejecutadas con respuesta HTTP válida
- **Cobertura:** Al menos 60% de líneas de código del backend cubiertas
