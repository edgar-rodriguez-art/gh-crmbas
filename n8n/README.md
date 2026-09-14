# wf-crmbas

Flujo de n8n que automatiza tres cosas para crmbas. Está creado en la instancia
y su código fuente vive aquí para poder revisarlo en las revisiones de código.

- **Instancia**: `https://edgrod.app.n8n.cloud`
- **Identificador**: `DcFxAN9SOQE4eLnq`
- **Fuente**: [`wf-crmbas.ts`](wf-crmbas.ts) (SDK de flujos de n8n)

## Qué hace

### 1. Entrega de la cola de correo

```
Aviso de crmbas (webhook) ──┐
                            ├─► Leer cola ─► Separar ─► Resend ─► Comunicar resultado
Cada 15 minutos ────────────┘
```

crmbas avisa en cuanto encola una notificación, y además el flujo revisa la cola
cada quince minutos. Ese segundo camino es lo que hace el sistema tolerante a
fallos: si el aviso se pierde por un corte de red, la notificación se entrega en
la siguiente pasada en lugar de quedarse olvidada.

El nodo de entrega continúa aunque falle, de modo que un correo rechazado no
corta el lote y su error se comunica igualmente a crmbas, que lo anota y lo
reintenta hasta tres veces.

### 2. Resumen matinal

Cada día laborable a las 08:00: indicadores del embudo, cierres previstos en los
próximos siete días y solicitudes de derechos pendientes, en un único correo al
equipo comercial y de administración.

### 3. Aviso de SLA

Cada hora: incidencias cuyo compromiso de servicio ha vencido o vence en las
próximas cuatro horas, en un único aviso agregado.

## Credenciales

Los secretos se guardan como **credenciales de n8n**, no como parámetros de los
nodos. Es lo que evita que acaben escritos en el JSON del flujo y en su historial
de versiones.

| Credencial | Tipo | Contenido |
|---|---|---|
| `crmbas API` | Custom Auth con plantilla | `{"headers":{"Authorization":"Bearer {{api_key}}"}}` con el valor de `CRM_WEBHOOK_SECRET`. |
| `Resend API` | Custom Auth con plantilla | Lo mismo, con la clave de API de Resend. |
| `crmbas webhook entrante` | Header Auth | Nombre `Authorization`, valor `Bearer <N8N_WEBHOOK_SECRET>`. Es lo que impide que cualquiera dispare el flujo. |

> Al crear el flujo, n8n asignó automáticamente una credencial preexistente al
> nodo `Aviso de crmbas`. **Sustitúyela** por `crmbas webhook entrante` antes de
> activarlo: si no, el webhook valida contra un secreto que no es el que envía
> crmbas y todos los avisos serán rechazados.

## Puesta en marcha

1. Crea las tres credenciales de la tabla.
2. Asígnalas a los nodos correspondientes.
3. Comprueba que la constante `CRM` del flujo apunta al dominio de producción.
4. Activa el flujo y copia la URL del webhook a `N8N_WEBHOOK_URL` en Vercel.

## Remitente

`onboarding@resend.dev` es el dominio compartido de pruebas de Resend y **solo
entrega al correo de la cuenta titular**. Para escribir a clientes reales hay que
verificar un dominio propio en Resend (SPF, DKIM y DMARC) y cambiar el remitente
en `notificaciones_email.remitente`.
