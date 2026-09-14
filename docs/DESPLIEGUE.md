# Despliegue

Cuatro servicios, en este orden: Supabase, GitHub, Vercel y n8n.

---

## 1. Supabase — `db-crmbas`

Proyecto en la organización `org-crmbas`, región **eu-west-3 (París)**. La región
importa: es lo que sostiene la afirmación de que no hay transferencias
internacionales de datos.

Aplica las migraciones de `supabase/migrations/` en orden numérico, desde el
panel (SQL Editor) o con la CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

| Migración | Contenido |
|---|---|
| `0001` | Tipos enumerados del dominio |
| `0002` | Validadores de NIF, NIE, CIF, IBAN y código postal |
| `0003` | Tablas del modelo |
| `0004` | Tablas de cumplimiento |
| `0005` | Funciones y disparadores |
| `0006` | Políticas RLS |
| `0007` | Vistas de explotación |
| `0008` | Dos registros de prueba por tabla |
| `0009` | Endurecimiento de la superficie expuesta |

Después, en el panel:

- **Authentication → Providers → Email**: deja activado el proveedor de correo y
  desactiva el registro abierto si no quieres que cualquiera cree cuenta.
- **Authentication → Password security**: activa la protección contra contraseñas
  filtradas (cotejo con HaveIBeenPwned). No puede activarse por migración.
- **Authentication → Multi-factor**: exige segundo factor al menos para las
  cuentas con rol de administración.
- Cambia las contraseñas de las dos cuentas de demostración antes de dar acceso
  a nadie.

Comprueba que no queda nada abierto:

```sql
select tablename from pg_tables
 where schemaname = 'public' and rowsecurity = false;   -- debe estar vacío
```

---

## 2. GitHub — `gh-crmbas`

El repositorio no contiene ningún secreto: `.gitignore` excluye `.env*.local`.
Verifícalo antes de hacerlo público:

```bash
git log -p --all | grep -iE "SERVICE_ROLE|BEGIN .*PRIVATE KEY|re_[A-Za-z0-9]{20}"
```

---

## 3. Vercel — `pr-crmbas`

Importa el repositorio. Framework: Next.js (se detecta solo).

### Variables de entorno

En **Settings → Environment Variables**, para *Production*, *Preview* y
*Development*:

| Variable | Valor | Expuesta al navegador |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública del proyecto | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio | **No** |
| `N8N_WEBHOOK_URL` | URL del webhook de `wf-crmbas` | No |
| `N8N_WEBHOOK_SECRET` | Secreto de crmbas hacia n8n | No |
| `CRM_WEBHOOK_SECRET` | Secreto de n8n hacia crmbas | No |
| `NEXT_PUBLIC_APP_URL` | URL pública de la aplicación | Sí |

Genera cada secreto por separado:

```bash
openssl rand -hex 32
```

Usa valores distintos para `N8N_WEBHOOK_SECRET` y `CRM_WEBHOOK_SECRET`: cada
dirección tiene su propia clave, de modo que comprometer una no compromete la
otra.

La aplicación arranca sin `SUPABASE_SERVICE_ROLE_KEY` ni las variables de n8n.
Lo único que queda desactivado es el correo automatizado, que degrada de forma
ordenada en lugar de romper la operación que lo habría disparado.

---

## 4. n8n — `wf-crmbas`

Importa `n8n/wf-crmbas.json` o créalo desde el panel. Necesita dos credenciales:

1. **Header Auth · crmbas** — `Authorization: Bearer <CRM_WEBHOOK_SECRET>`.
   La usan los nodos HTTP que llaman a la API de crmbas.
2. **Header Auth · Resend** — `Authorization: Bearer <RESEND_API_KEY>`.
   La usa el nodo que entrega el correo.
3. **Header Auth · entrada** — el mismo `N8N_WEBHOOK_SECRET` que crmbas envía,
   para que el nodo Webhook rechace lo que no venga de la aplicación.

Guardar los secretos como credenciales y no como parámetros es lo que evita que
acaben escritos en el JSON del flujo.

### Remitente

`onboarding@resend.dev` es el dominio compartido de pruebas de Resend: **solo
entrega al correo de la cuenta titular**. Para escribir a clientes reales hay que
verificar un dominio propio en Resend (registros SPF, DKIM y DMARC en el DNS) y
cambiar `notificaciones_email.remitente`.

---

## Comprobación posterior

```bash
# Cabeceras de seguridad
curl -sI https://<tu-dominio>/entrar | grep -iE "content-security|strict-transport|x-frame"

# Una ruta protegida sin sesión debe redirigir
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://<tu-dominio>/clientes

# La API rechaza sin credenciales
curl -s -o /dev/null -w "%{http_code}\n" https://<tu-dominio>/api/n8n/cola   # 401
```

Y en el panel de Supabase, **Advisors → Security**, después de cada cambio de
esquema.
