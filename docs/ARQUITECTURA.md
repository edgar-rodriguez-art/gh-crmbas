# Arquitectura

## Decisión de fondo: la autorización vive en la base de datos

Un CRM guarda datos personales de terceros. Si la única barrera fuera el código
de la aplicación, cualquier ruta olvidada, cualquier consulta mal filtrada y
cualquier endpoint nuevo serían una fuga potencial.

Aquí la autorización está en PostgreSQL. Cada consulta del navegador y del
servidor viaja con el JWT de la persona autenticada y la clave pública, y las
políticas RLS deciden qué filas devuelve la base de datos. Una pantalla mal
programada puede enseñar una tabla vacía; no puede enseñar datos ajenos.

La clave de servicio, que sí ignora RLS, se usa en exactamente dos sitios: la
cola de correo y los puntos de entrada de n8n. Nunca lleva el prefijo
`NEXT_PUBLIC_`, así que no puede acabar en el paquete del navegador.

## Flujo de una petición

```
Navegador
   │  cookie de sesión
   ▼
middleware.ts ───── refresca el token · aplica CSP, HSTS y demás cabeceras
   │                 redirige a /entrar si no hay sesión
   ▼
Componente de servidor  ── crearClienteServidor() ──► Supabase (con RLS)
   │
   ├─ pinta solo lo que la base de datos ha devuelto
   │
   └─ Acción de servidor ── valida con zod ──► Supabase (con RLS)
                                 │
                                 └─ encolarCorreo() ──► notificaciones_email
                                                  └──► aviso firmado a n8n
```

## Por qué las mutaciones son acciones de servidor y no una API REST

Una API REST propia sería una segunda superficie que proteger, con su propia
autenticación y sus propias comprobaciones de rol. Las acciones de servidor
viajan por el mismo canal que la página, con la misma sesión, y no existen como
URL adivinable. La única API pública es la que consume n8n, y está autenticada
con un secreto compartido.

Cada acción vuelve a comprobar sesión y rol antes de tocar nada. Ocultar un botón
es comodidad para quien usa la aplicación, no una medida de seguridad.

## Por qué el correo pasa por n8n

crmbas no conoce a Resend. Escribe la notificación en `notificaciones_email` y
avisa al flujo `wf-crmbas`; n8n compone el mensaje, lo entrega y devuelve el
identificador del proveedor, que se anota en la misma fila.

Esto compra tres cosas:

1. **Trazabilidad.** Toda comunicación con un cliente queda en la base de datos
   con su estado, sus intentos y el identificador de envío, que es lo que permite
   responder a una reclamación.
2. **Independencia del proveedor.** Cambiar Resend por otro servicio es cambiar
   un nodo del flujo, no desplegar la aplicación.
3. **Resistencia a fallos.** Si n8n no responde al aviso, la fila se queda en
   `pendiente` y el propio flujo la recoge en su siguiente pasada programada. La
   operación de negocio que originó el correo nunca falla por culpa del correo.

## Numeración y huella de los presupuestos

Dos disparadores, con responsabilidades separadas:

- **Al crear** (`asignar_numero_presupuesto`): un bloqueo consultivo serializa la
  numeración dentro de la transacción y asigna el correlativo siguiente de la
  serie y el ejercicio. No hay huecos ni duplicados aunque dos personas creen un
  presupuesto a la vez.
- **Al emitir** (`sellar_presupuesto`): cuando el documento deja de ser borrador,
  que es cuando su contenido queda fijado, se calcula una huella SHA-256 sobre
  número, fecha, cliente, importes y la huella del anterior documento emitido de
  la serie.

Calcular la huella al crear habría sido inútil: en ese momento el presupuesto
todavía no tiene líneas y su total es cero. Sellar al emitir es también lo que
tiene sentido jurídico, porque es el documento que se comunica al cliente.

Alterar o eliminar un presupuesto emitido rompe la cadena de todos los
posteriores, y eso es comprobable con una consulta.

## Cálculo de impuestos

`recalcular_presupuesto()` se dispara con cada cambio en las líneas y recalcula
base, cuota de IVA, recargo y total a partir del régimen fiscal del cliente:

- **General**: IVA al tipo de cada línea.
- **Recargo de equivalencia**: además, 5,2 % sobre el 21 %, 1,4 % sobre el 10 % y
  0,5 % sobre el 4 %.
- **Exento, intracomunitario e inversión del sujeto pasivo**: cuota cero.

El importe de cada línea es una columna calculada y almacenada: `cantidad ×
precio × (1 − descuento)`, redondeado a dos decimales por la propia base de
datos. No hay dos sitios donde pueda calcularse distinto.

## Roles

| Rol | Alcance |
|---|---|
| `admin` | Todo, incluidos usuarios, catálogo, auditoría y resolución de solicitudes de derechos. |
| `comercial` | Clientes, contactos, oportunidades, presupuestos e incidencias. |
| `soporte` | Incidencias y RMA; consulta del resto. |
| `lectura` | Solo consulta. |

Toda cuenta nueva nace como `lectura`, salvo la primera del sistema, que recibe
`admin` porque si no nadie podría configurar nada. Nadie puede cambiar su propio
rol ni desactivarse a sí mismo.

## Qué no hace

- No factura. Emite presupuestos; la factura es competencia del ERP o del
  programa de facturación, al que se exporta el presupuesto aceptado.
- No gestiona almacén. Lleva el stock del catálogo como referencia comercial, no
  como inventario con movimientos.
- No envía correo por sí mismo. Ver arriba.
