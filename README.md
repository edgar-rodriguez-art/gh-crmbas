# crmbas

CRM para un negocio de **distribución y servicios informáticos** que opera en
**España**. Gestiona clientes, embudo comercial, presupuestos, catálogo y
servicio técnico, y lleva incorporado el cumplimiento normativo que exige operar
con datos personales y documentos mercantiles en el mercado español.

```
Next.js 15 (App Router)  →  Supabase (PostgreSQL + Auth + RLS)  →  eu-west-3
        │                            ▲
        │ webhook firmado            │ clave de servicio, solo en el servidor
        ▼                            │
   n8n · wf-crmbas  ──────────►  Resend  ──────►  destinatario
```

## Qué resuelve

| Módulo | Contenido |
|---|---|
| **Clientes** | Empresas, autónomos y particulares. NIF/NIE/CIF validado con el algoritmo de la AEAT, IBAN con dígitos de control mod-97, código postal contra las provincias del INE. |
| **Contactos** | Personas por cliente, con su consentimiento comercial registrado por separado. |
| **Embudo** | Seis etapas, importe ponderado por probabilidad y motivo de pérdida obligatorio al cerrar en negativo. |
| **Presupuestos** | Numeración correlativa sin huecos por serie y ejercicio, cálculo automático de IVA y de recargo de equivalencia, y huella SHA-256 encadenada al emitir. |
| **Catálogo** | Equipamiento informático con garantía legal mínima de 36 meses y ecotasa RAEE. |
| **Incidencias y RMA** | Averías, garantías e instalaciones con compromiso de nivel de servicio y aviso antes de incumplirlo. |
| **Protección de datos** | Solicitudes de derechos con su plazo legal, evidencia de consentimientos y registro de actividades de tratamiento. |
| **Auditoría** | Traza de solo anexado de todo cambio sobre datos personales o económicos. |
| **Correo automatizado** | Cola de notificaciones entregadas por n8n a través de Resend, con su identificador de envío. |

## Elección del stack

| Pieza | Decisión | Motivo |
|---|---|---|
| **Next.js 15** en App Router | Componentes de servidor y acciones de servidor | Los datos personales no viajan al navegador salvo lo que se pinta; no hay una API pública que proteger aparte. |
| **Supabase** | PostgreSQL gestionado con RLS y Auth | La autorización vive en la base de datos, no en la aplicación: un fallo en la interfaz no expone datos. Región UE disponible. |
| **RLS en todas las tablas** | Denegación por defecto | Cada consulta viaja con el JWT de la persona; PostgreSQL decide qué filas devuelve. |
| **n8n + Resend** | Correo delegado | La aplicación nunca habla con el proveedor de correo: cambiarlo no toca el código. Cada envío queda trazado. |
| **Vercel** | Despliegue | Integración directa con el repositorio y variables de entorno por entorno. |
| **Zod** | Validación | Mismo esquema en el formulario y en la acción de servidor. |
| **Tailwind v4** | Estilos | Sin dependencias de interfaz pesadas; el paquete que llega al navegador es pequeño. |

## Normativa aplicada

Detalle completo en [`docs/CUMPLIMIENTO.md`](docs/CUMPLIMIENTO.md).

- **Privacidad**: RGPD (UE 2016/679) y LOPDGDD 3/2018 — base jurídica por cliente,
  consentimiento granular con evidencia, derechos con plazo de un mes, registro
  de actividades de tratamiento, plazos de conservación, datos en la UE.
- **Seguridad**: ENS (RD 311/2022) e ISO/IEC 27001 — control de acceso por roles,
  traza de auditoría inmutable, cabeceras de protección del navegador, cifrado
  en tránsito y en reposo, secretos fuera del repositorio.
- **Sectorial**: IVA español con recargo de equivalencia (Ley 37/1992), huella
  encadenada en la línea del reglamento Veri*factu (RD 1007/2023), garantía legal
  de tres años (RDL 7/2021), ecotasa RAEE (RD 110/2015), LSSI-CE 34/2002 para la
  comunicación comercial.
- **Interoperabilidad**: identificadores validados en la base de datos, API REST
  documentada, webhooks firmados, formatos y códigos oficiales (INE, ISO 3166,
  ISO 4217, ISO 13616, EAN-13).

## Puesta en marcha

```bash
npm install
cp .env.example .env.local     # y rellena los valores
npm run dev
```

Las migraciones de `supabase/migrations/` se aplican en orden. La última
(`0008_datos_prueba.sql`) carga dos registros de ejemplo en cada tabla.

```bash
npm run check                  # tipos + lint + compilación
```

Despliegue paso a paso en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).
Manual de uso en [`docs/MANUAL-USUARIO.md`](docs/MANUAL-USUARIO.md).

## Estructura

```
src/
  app/
    (app)/            Pantallas con sesión iniciada
    api/n8n/          Puntos de entrada que consume el flujo wf-crmbas
    entrar/           Acceso
    privacidad/       Información de tratamiento (pública)
  components/         Interfaz compartida
  lib/
    acciones.ts       Acciones de servidor (mutaciones)
    identificadores.ts  NIF, NIE, CIF, IBAN y código postal
    seguridad.ts      Firma HMAC y verificación de portador
    n8n.ts            Cola de correo e integración con el flujo
supabase/migrations/  Esquema, RLS, vistas y datos de prueba
n8n/                  Definición del flujo wf-crmbas
docs/                 Arquitectura, seguridad, cumplimiento, despliegue y manual
```
