# Cumplimiento normativo

Qué exige cada norma, dónde se implementa y cómo comprobarlo. Las referencias
apuntan a archivos concretos del repositorio.

---

## 1. Privacidad y protección de datos

**Reglamento (UE) 2016/679 (RGPD)** y **Ley Orgánica 3/2018 (LOPDGDD)**.

| Exigencia | Implementación | Dónde |
|---|---|---|
| Licitud del tratamiento (art. 6) | Cada cliente declara su base jurídica y no puede guardarse sin ella. | `cuentas.base_legal_tratamiento` · `0003_tablas.sql` |
| Prueba del consentimiento (art. 7.1) | Tabla dedicada con finalidad granular, canal, texto informado, evidencia JSON, IP y marca temporal. La revocación no borra la evidencia: añade su fecha. | `consentimientos` · `0004_tablas_cumplimiento.sql` |
| Derechos de las personas (arts. 15-22) | Las seis solicitudes se registran con referencia propia; el plazo de un mes es una columna calculada, no un recordatorio manual. | `solicitudes_rgpd.fecha_limite` · `0004_tablas_cumplimiento.sql` |
| Plazo de respuesta (art. 12.3) | La pantalla de cumplimiento destaca en rojo lo que ha superado el plazo, y el inicio avisa de lo pendiente. | `src/app/(app)/cumplimiento/page.tsx` |
| Registro de actividades (art. 30) | Tabla con finalidad, base jurídica, categorías de interesados y datos, destinatarios, transferencias, plazo y medidas. | `tratamientos` · `0004_tablas_cumplimiento.sql` |
| Minimización (art. 5.1.c) | No se recogen categorías especiales. El contacto es profesional. | Modelo de datos |
| Limitación del plazo (art. 5.1.e) | Los plazos de conservación son configuración consultable, no una decisión implícita. | `ajustes.conservacion_datos` |
| Protección desde el diseño (art. 25) | RLS activo en todas las tablas con denegación por defecto; la interfaz nunca es la única barrera. | `0006_rls.sql` |
| Seguridad del tratamiento (art. 32) | Cifrado en tránsito y en reposo, control de acceso por roles, traza de auditoría, copias de seguridad del proveedor. | `0006_rls.sql`, `src/middleware.ts` |
| Encargados del tratamiento (art. 28) | Supabase, n8n y Resend figuran como destinatarios en el registro de actividades. | `tratamientos.destinatarios` |
| Transferencias internacionales (cap. V) | Base de datos en `eu-west-3` (París). No hay transferencia fuera de la UE. | Proyecto `db-crmbas` |
| Información al interesado (arts. 13-14) | Página pública accesible sin sesión. | `src/app/privacidad/page.tsx` |

**Cómo comprobarlo**

```sql
-- Ninguna tabla sin RLS
select tablename from pg_tables
 where schemaname = 'public' and rowsecurity = false;

-- Solicitudes fuera de plazo
select referencia, tipo, fecha_limite from solicitudes_rgpd
 where estado in ('recibida','en_tramite') and fecha_limite < current_date;
```

---

## 2. Seguridad de la información

**Real Decreto 311/2022 (Esquema Nacional de Seguridad)** y **UNE-EN ISO/IEC 27001**.

| Medida | Implementación | Dónde |
|---|---|---|
| Identificación y autenticación (ENS op.acc.1-5) | Supabase Auth con credenciales nominativas; el token se valida contra el servidor en cada petición, no se confía en la cookie. | `src/lib/sesion.ts` |
| Mínimo privilegio (ENS op.acc.4 · ISO A.5.15) | Cuatro roles con políticas RLS distintas por operación. Toda cuenta nueva nace en solo lectura. | `0006_rls.sql`, `crear_perfil_para_usuario()` |
| Segregación de funciones (ISO A.5.3) | Solo administración gestiona usuarios, catálogo, auditoría y resolución de derechos. Nadie puede cambiar su propio rol. | `src/lib/acciones.ts` |
| Registro de actividad (ENS op.exp.8 · ISO A.8.15) | Disparadores escriben el estado anterior y posterior de cada cambio. La aplicación no tiene permiso para escribir ni borrar en la traza. | `registrar_auditoria()`, `revoke ... on public.auditoria` |
| Protección de las comunicaciones (ENS mp.com.2) | HSTS con precarga, CSP restrictiva, `frame-ancestors 'none'`, `nosniff`, política de referente. | `src/middleware.ts` |
| Configuración segura (ISO A.8.9) | Sin cabecera `X-Powered-By`; `Cache-Control: no-store` en todo lo que lleva datos personales. | `next.config.ts`, `src/middleware.ts` |
| Gestión de secretos (ISO A.8.24) | Ningún secreto en el repositorio. La clave de servicio nunca lleva prefijo público. | `.env.example`, `src/lib/entorno.ts` |
| Superficie mínima (ENS mp.sw.1) | Ninguna función auxiliar queda expuesta como endpoint REST; los privilegios por omisión se revocan. | `0009_endurecimiento.sql` |
| Integridad de la información (ENS mp.info.4) | Huella SHA-256 encadenada en los presupuestos emitidos. | `sellar_presupuesto()` |
| Autenticación entre sistemas (ISO A.8.21) | n8n se identifica con un secreto compartido sobre TLS; crmbas firma además con HMAC-SHA256 y marca temporal, con ventana de cinco minutos y comparación en tiempo constante. | `src/lib/seguridad.ts`, `src/lib/api-n8n.ts` |
| Accesibilidad (UNE-EN 301549) | Foco visible, etiquetas asociadas, mensajes con `role="status"`, contraste suficiente en ambos temas. | `src/app/globals.css`, `src/components/formulario.tsx` |

**Pendiente de activar en el panel de Supabase** (no es configurable por migración):

- Autenticación → Protección contra contraseñas filtradas (cotejo con HaveIBeenPwned).
- Autenticación → Segundo factor para las cuentas con rol de administración.

---

## 3. Normativa sectorial

| Norma | Qué exige | Implementación |
|---|---|---|
| **Ley 37/1992 del IVA** | Tipo general del 21 % en material informático. Recargo de equivalencia del 5,2 % para minoristas personas físicas (arts. 148-149 y 161). | `recalcular_presupuesto()` aplica el recargo según el régimen de la cuenta. Una restricción impide asignar recargo de equivalencia a una sociedad. |
| **Ley 37/1992, art. 84.Uno.2.g** | Inversión del sujeto pasivo en entregas de portátiles y consolas por encima de 10.000 €. | Régimen `inversion_sujeto_pasivo`: la cuota de IVA se calcula como cero. |
| **RD 1007/2023 (Veri*factu)** | Registros de facturación encadenados e inalterables. | Numeración correlativa sin huecos por serie y ejercicio, y huella SHA-256 que encadena cada documento emitido con el anterior. Modificar o eliminar uno rompe la cadena de todos los posteriores. |
| **RDL 7/2021 (TRLGDCU)** | Garantía legal de conformidad de tres años desde la entrega. | `productos.garantia_meses` no admite menos de 36 salvo en software y servicios. |
| **RD 110/2015 (RAEE)** | Información sobre la gestión de residuos de aparatos eléctricos y electrónicos. | Categoría RAEE y ecotasa por producto, visibles en el catálogo. |
| **Ley 34/2002 (LSSI-CE), art. 21** | Consentimiento previo para la comunicación comercial electrónica. | Ningún correo comercial se encola sin `acepta_comunicaciones`. Cada envío queda registrado. |
| **Ley 34/2002, art. 10** | Información general del prestador. | Página de aviso legal. |
| **Ley 34/2002, art. 22.2** | Consentimiento para cookies no imprescindibles. | Solo se usa la cookie de sesión, exceptuada del deber de consentimiento. No hay analítica ni terceros. |
| **Código de Comercio, art. 30** | Conservación de la documentación mercantil durante seis años. | Plazo declarado en `ajustes.conservacion_datos` y en el registro de tratamientos. |

---

## 4. Interoperabilidad y conectividad

| Aspecto | Implementación |
|---|---|
| Identificadores fiscales | NIF, NIE y NIF de entidad validados con el algoritmo oficial de la AEAT, en la base de datos y en el formulario. |
| Cuentas bancarias | IBAN validado con los dígitos de control mod-97 de la norma ISO 13616. |
| Códigos territoriales | Código postal contra el rango de provincias del INE; país en ISO 3166-1 alfa-2. |
| Moneda | ISO 4217 (`EUR`), con formato `es-ES` y zona horaria `Europe/Madrid`. |
| Producto | EAN-13 con formato verificado. |
| API | Cuatro puntos de entrada REST documentados en `docs/API.md`, con respuestas JSON y autenticación por secreto compartido. |
| Webhooks | Firma HMAC-SHA256 con marca temporal, resistente a repetición. |
| Salida de datos | Todo el modelo es PostgreSQL estándar: exportable a CSV, JSON o a un formato de factura electrónica (Facturae, UBL/PEPPOL) sin transformación estructural. |
| Portabilidad (RGPD art. 20) | Los datos de una persona se extraen con una consulta SQL por `cuenta_id` o `contacto_id`. |
