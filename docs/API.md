# API de integración

Cuatro puntos de entrada que consume el flujo `wf-crmbas` de n8n. No están
pensados para el navegador: no hay sesión de usuario, sino un secreto compartido.

## Autenticación

Se admite cualquiera de las dos pruebas de identidad. Basta con una.

### Portador (lo que usa n8n)

```
Authorization: Bearer <CRM_WEBHOOK_SECRET>
```

El secreto vive en una credencial cifrada de n8n, nunca en el JSON del flujo.
La comparación es en tiempo constante.

### Firma HMAC

```
x-crmbas-firma:          hex(HMAC-SHA256(secreto, "<marca-temporal>.<cuerpo>"))
x-crmbas-marca-temporal: <segundos desde epoch>
```

El cuerpo es la cadena vacía en las peticiones `GET`. La marca temporal debe
estar dentro de una ventana de 300 segundos, lo que impide reutilizar una
petición capturada.

Una petición sin credenciales válidas recibe `401` sin detalle del motivo: el
motivo concreto queda en el registro del servidor, no en la respuesta.

Si el entorno no tiene configurada la clave de servicio de Supabase, los cuatro
puntos de entrada responden `503`.

---

## `GET /api/n8n/cola`

Notificaciones pendientes de envío, hasta 50 y con menos de tres intentos.

```json
{
  "pendientes": [
    {
      "id": "uuid",
      "plantilla": "incidencia_abierta",
      "destinatario": "persona@ejemplo.es",
      "remitente": "onboarding@resend.dev",
      "asunto": "Incidencia INC-2026-00002 registrada",
      "cuerpo_texto": "…",
      "datos": { "flujo": "wf-crmbas" },
      "intentos": 0
    }
  ],
  "total": 1
}
```

## `POST /api/n8n/resultado`

Comunica el desenlace de una entrega. Incrementa el contador de intentos.

```json
{
  "notificacion_id": "uuid",
  "estado": "enviado",
  "id_proveedor": "re_abc123",
  "error": null
}
```

Respuestas: `200` con `{ok: true}`, `400` si el cuerpo no encaja, `404` si la
notificación no existe.

## `GET /api/n8n/resumen-diario`

Datos del resumen matinal: indicadores, oportunidades que cierran en los
próximos siete días, solicitudes de derechos pendientes y destinatarios.

## `GET /api/n8n/avisos-sla`

Incidencias abiertas cuyo compromiso de servicio ha vencido o vence en las
próximas cuatro horas.

```json
{
  "comprobado_en": "2026-09-14T22:00:00.000Z",
  "total": 2,
  "vencidas": 1,
  "incidencias": [
    { "referencia": "INC-2026-00001", "razon_social": "…", "horas_restantes": -3.2 }
  ]
}
```
