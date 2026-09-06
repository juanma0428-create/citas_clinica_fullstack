# SysCitas — Sistema de Reservas y Gestión Hospitalaria 🏥

Sistema Full-Stack para la gestión de reservas de citas médicas, disponibilidad de consultorios y recursos, historial clínico de pacientes y administración hospitalaria. Construido con **Angular 18** (Standalone Components, Signals) y **Node.js (Express + TypeScript)**, integrando el modelo de base de datos relacional de `sys_citas.sql`.

---

## ⚡ Inicio Rápido (Quickstart)

El sistema cuenta con un **servidor unificado en el puerto 3000** que sirve simultáneamente la aplicación web Angular y la API RESTful. Además, incluye un motor con los datos de prueba de `sys_citas.sql` precargados, por lo que **funciona inmediatamente sin requerir configuración previa de base de datos**.

### 1. Iniciar la Aplicación Completa (Frontend + Backend)
```bash
cd backend
npm install
npm start
```
Abre tu navegador en: **`http://localhost:3000`**

*(Opcional: Si deseas ejecutar el frontend en modo desarrollo con recarga en caliente de Angular: `cd frontend && npm start` en el puerto 4200).*

---

## 🚀 Despliegue en Render (Render Ready)

El repositorio está **100% preparado para Render** con configuración Blueprint (`render.yaml`), `package.json` raíz y motor de datos mock autónomo (no requiere contratar base de datos externa):

### Opción 1: Despliegue con 1 Clic (Blueprint)
1. Inicia sesión en [Render](https://dashboard.render.com/).
2. Haz clic en **New +** &rarr; **Blueprint**.
3. Conecta tu repositorio de GitHub: `juanma0428-create/citas_clinica_fullstack`.
4. Render detectará automáticamente el archivo `render.yaml` y configurará:
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
5. Haz clic en **Apply**. En 2-3 minutos tu aplicación estará en línea con HTTPS gratuito.

### Opción 2: Web Service Manual en Render
Si prefieres crearlo como un Web Service normal:
1. **New +** &rarr; **Web Service** &rarr; Conectar `citas_clinica_fullstack`.
2. Parámetros de configuración:
   - **Runtime:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables**:
     - `NODE_VERSION`: `20.16.0`
3. ¡Listo! Tu app estará en `https://syscitas-hospital.onrender.com`.

### Conectar tu dominio de Spaceship en Render
1. En tu Web Service de Render, ve a **Settings** &rarr; **Custom Domains**.
2. Añade tu subdominio (ej: `citas.tudominio.com`).
3. En tu panel de **Spaceship** (Advanced DNS), crea el registro:
   - **Type:** `CNAME`
   - **Host:** `citas`
   - **Target / Value:** la dirección que te indique Render (ej: `syscitas-hospital.onrender.com`).
Render gestionará el certificado SSL de forma automática y gratuita.

---

## 🌐 Publicación Local con Túnel (Cloudflare + Spaceship)

Si prefieres ejecutarlo localmente y tunelarlo a tu dominio propio:

### Configuración con Cloudflare Tunnel (100% Gratis y Permanente)

#### Paso 1: Instalar `cloudflared` en Windows
```powershell
winget install --id Cloudflare.cloudflared
```

#### Paso 2: Autenticar y crear el túnel
```powershell
cloudflared tunnel login
cloudflared tunnel create syscitas
```
Esto te devolverá un **Tunnel ID** (ej: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

#### Paso 3: Configurar el registro DNS en Spaceship
1. Entra a tu panel de **Spaceship**.
2. Selecciona tu dominio &rarr; **Advanced DNS** (o **DNS Records**).
3. Añade un nuevo registro:
   - **Type:** `CNAME`
   - **Host / Name:** `citas` *(o `@` si deseas usar la raíz del dominio)*
   - **Target / Value:** `<TUNNEL-ID>.cfargotunnel.com`
   - **TTL:** 300 (o Auto)
4. Guarda los cambios.

#### Paso 4: Levantar el túnel localmente
```powershell
cloudflared tunnel run --url http://localhost:3000 syscitas
```
¡Tu sistema estará disponible públicamente en `https://citas.tudominio.com` con SSL gratuito!

---

## 🔑 Credenciales de Acceso Rápido (1-Click en el Login)

La pantalla de acceso cuenta con botones directos para ingresar con los perfiles del dump SQL:

| Rol | Usuario | Contraseña | Descripción / Perfil |
| :--- | :--- | :--- | :--- |
| **Paciente** | `paciente_juan` | `clave123` | **Juan Manuel Chica** — Historial médico con diagnósticos y recetas cargadas |
| **Paciente** | `paciente_maria` | `clave123` | **María García** — Consulta pediátrica activa |
| **Médico** | `dr_carlos` | `clave123` | **Dr. Carlos López** — Especialista en Cardiología (Consultorio A1) |
| **Médico** | `dra_ana` | `clave123` | **Dra. Ana Martínez** — Especialista en Pediatría (Consultorio B2) |
| **Administrador** | `admin_roberto` | `clave123` | **Roberto Sánchez** — Supervisión total, CRUD de usuarios y citas |

---

## 🌟 Módulos y Funcionalidades

### 1. Portal del Paciente (`/paciente`)
- **Reservar Cita Paso a Paso**: Selección guiada de Especialidad &rarr; Médico tratante &rarr; Franjas horarias disponibles en tiempo real &rarr; Consultorio asignado &rarr; Motivo de consulta.
- **Mis Citas**: Tarjetas interactivas con estados (`confirmada`, `pendiente`, `finalizada`, `cancelada`), con opciones para **reprogramar fecha/hora** o **cancelar** liberando el horario del médico.
- **Historial Médico & Recetas**: Línea de tiempo de consultas anteriores con diagnósticos formales y recetas médicas emitidas, con opción de imprimir expediente.
- **Recordatorios**: Centro de notificaciones en cabecera con alertas automáticas.

### 2. Portal del Médico (`/medico`)
- **Mi Agenda Diaria**: Visualización de pacientes asignados con filtros por estado.
- **Atención Clínica**: Registro de diagnósticos y recetas farmacológicas, finalizando la consulta y actualizando el historial del paciente.
- **Gestión de Horarios**: Creación de nuevos bloques de atención médica (fecha y hora) para abrir disponibilidad en tiempo real.

### 3. Panel de Administración (`/admin`)
- **Dashboard & KPIs**: Estadísticas de ocupación, citas por especialidad y estado de reservas.
- **CRUD Completo de Usuarios**: Creación, lectura, edición de datos/credenciales y baja de Pacientes, Médicos y Administradores.
- **Gestión Integral de Reservas**: Aprobación de citas pendientes, rechazo/cancelación con liberación de horario y modal de **modificación** (reasignación de médico, sala, horario y motivo).
- **Salas y Equipamiento**: Catálogo de consultorios y control de inventario de equipos médicos por especialidad.

---

## 🔐 Seguridad y Cifrado de Datos

- **Cifrado de Contraseñas (Bcrypt):**
  - Registro de usuarios y cambios de clave utilizan `bcrypt.hash(password, 10)` con salting.
  - Las contraseñas en texto plano de `sys_citas.sql` (`clave123`) son compatibles y se ascienden automáticamente a hashes seguros Bcrypt en su primer inicio de sesión.
- **Cifrado de Historial Clínico (AES-256-GCM):**
  - Los campos de diagnósticos y recetas médicas (`tb_citas.diagnosticos`, `tb_citas.recetas`) se cifran en reposo mediante algoritmo militar AES-256-GCM con vectores de inicialización (IV) únicos y autenticación de integridad (Auth Tag).
- **Control de Acceso (RBAC):**
  - Autenticación mediante **JSON Web Tokens (JWT)** con interceptor HTTP y guardas de rutas en Angular.

---

## 🗄️ Modelo de Base de Datos (`sys_citas.sql`)

El sistema implementa fielmente las 10 tablas del esquema:
- `tb_roles` & `tb_usuarios`: Autenticación y roles.
- `tb_administradores`, `tb_medicos`, `tb_clientes`: Perfiles de usuario.
- `tb_especialidades`, `tb_salas`, `tb_equipos`: Infraestructura hospitalaria.
- `tb_horarios`: Franjas horarias por médico con control de disponibilidad (`0/1`).
- `tb_citas`: Relación entre paciente, médico, sala, horario, diagnóstico y recetas.

*Para conectar tu base de datos MySQL local:*
1. Crea la base de datos `db_sys_citas` e importa el archivo [sys_citas.sql](file:///f:/DevDiaz/Para%20Juanmo/Project3/sys_citas.sql).
2. Ajusta las credenciales en `backend/.env` (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).
*(Si MySQL no está iniciado, la aplicación utiliza automáticamente su motor en memoria pre-cargado para garantizar funcionamiento continuo).*
