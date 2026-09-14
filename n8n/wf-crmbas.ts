/**
 * wf-crmbas — automatizaciones de crmbas en n8n.
 *
 * Escrito con el SDK de flujos de n8n. Ver n8n/README.md para las credenciales
 * que hay que crear antes de activarlo.
 */
import { workflow, node, trigger, ifElse, newCredential, expr } from '@n8n/workflow-sdk';

// Dirección pública de crmbas. Si el dominio de Vercel cambia, este es el único
// valor que hay que tocar en el flujo.
const CRM = 'https://pr-crmbas.vercel.app';

// Los secretos viven en credenciales cifradas de n8n, nunca como parámetros:
// así no quedan escritos en el JSON del flujo ni en su historial de versiones.
const credencialCrm = newCredential('crmbas API');
const credencialResend = newCredential('Resend API');
const credencialEntrada = newCredential('crmbas webhook entrante');

// --- Disparadores ------------------------------------------------------------

const avisoDeCrmbas = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Aviso de crmbas',
    parameters: {
      httpMethod: 'POST',
      path: 'wf-crmbas',
      authentication: 'headerAuth',
      responseMode: 'onReceived',
      options: { ignoreBots: true },
    },
    credentials: { httpHeaderAuth: credencialEntrada },
  },
});

const cadaQuinceMinutos = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Cada 15 minutos',
    parameters: {
      rule: { interval: [{ field: 'minutes', minutesInterval: 15 }] },
    },
  },
});

const cadaManana = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Cada laborable a las 08:00',
    parameters: {
      rule: { interval: [{ field: 'cronExpression', expression: '0 8 * * 1-5' }] },
    },
  },
});

const cadaHora = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Cada hora',
    parameters: {
      rule: { interval: [{ field: 'hours', hoursInterval: 1 }] },
    },
  },
});

// --- Flujo 1: entrega de la cola de correo -----------------------------------

const leerCola = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Leer cola de correo',
    // El aviso de crmbas trae un solo elemento, pero la lectura de la cola debe
    // hacerse una vez por ejecución en cualquier caso.
    executeOnce: true,
    parameters: {
      method: 'GET',
      url: `${CRM}/api/n8n/cola`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      options: { timeout: 15000 },
    },
    credentials: { httpTemplatedCustomAuth: credencialCrm },
  },
});

const separarPendientes = node({
  type: 'n8n-nodes-base.splitOut',
  version: 1,
  config: {
    name: 'Separar pendientes',
    parameters: { fieldToSplitOut: 'pendientes' },
  },
});

const entregarConResend = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Entregar con Resend',
    // Un fallo de entrega no debe cortar el lote: el resultado se comunica igual
    // a crmbas, que lo anota y lo reintentará en la próxima pasada.
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: 'https://api.resend.com/emails',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ JSON.stringify({ from: $json.remitente, to: [$json.destinatario], subject: $json.asunto, text: $json.cuerpo_texto }) }}'),
      options: { timeout: 20000 },
    },
    credentials: { httpTemplatedCustomAuth: credencialResend },
  },
});

const comunicarResultado = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Comunicar resultado a crmbas',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: `${CRM}/api/n8n/resultado`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("={{ JSON.stringify({ notificacion_id: $('Separar pendientes').item.json.id, estado: $json.id ? 'enviado' : 'error', id_proveedor: $json.id || null, error: $json.id ? null : ($json.error?.message || $json.message || 'Resend no devolvió identificador de envío') }) }}"),
      options: { timeout: 15000 },
    },
    credentials: { httpTemplatedCustomAuth: credencialCrm },
  },
});

// --- Flujo 2: resumen matinal para el equipo ---------------------------------

const leerResumen = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Leer resumen diario',
    parameters: {
      method: 'GET',
      url: `${CRM}/api/n8n/resumen-diario`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      options: { timeout: 15000 },
    },
    credentials: { httpTemplatedCustomAuth: credencialCrm },
  },
});

const componerResumen = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Componer resumen',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `// Un único correo con el estado del día, en lugar de un aviso por asunto.
const d = $input.first().json;
const k = d.indicadores || {};
const euros = (n) => Number(n || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

const lineas = [
  'Resumen de crmbas — ' + new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }),
  '',
  'Embudo abierto: ' + euros(k.embudo_importe) + ' en ' + (k.oportunidades_abiertas || 0) + ' oportunidades.',
  'Ganado este ejercicio: ' + euros(k.ganado_ejercicio) + '.',
  'Clientes activos: ' + (k.cuentas_activas || 0) + '.',
  'Incidencias abiertas: ' + (k.incidencias_abiertas || 0) + ', de las cuales ' + (k.incidencias_sla_vencido || 0) + ' con el SLA vencido.',
];

const cierres = d.cierres_proximos || [];
lineas.push('');
if (cierres.length === 0) {
  lineas.push('No hay oportunidades que cierren en los próximos siete días.');
} else {
  lineas.push('Cierres previstos en los próximos siete días:');
  for (const o of cierres) {
    const cliente = (o.cuentas && o.cuentas.razon_social) || 'sin cliente';
    lineas.push('  · ' + o.referencia + ' — ' + o.titulo + ' (' + cliente + ') — ' + euros(o.importe_estimado) + ' — ' + o.fecha_cierre_prevista);
  }
}

const rgpd = d.solicitudes_rgpd_pendientes || [];
if (rgpd.length > 0) {
  lineas.push('');
  lineas.push('Solicitudes de derechos pendientes (el plazo legal es de un mes):');
  for (const s of rgpd) {
    lineas.push('  · ' + s.referencia + ' — ' + s.tipo + ' — responder antes del ' + s.fecha_limite);
  }
}

const destinatarios = (d.destinatarios || []).map((p) => p.email).filter(Boolean);

return [{
  json: {
    asunto: 'crmbas · resumen del día',
    texto: lineas.join('\\n'),
    destinatarios,
    hay_destinatarios: destinatarios.length > 0,
  },
}];`,
    },
  },
});

const hayEquipo = ifElse({
  version: 2.3,
  config: {
    name: '¿Hay a quién avisar?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [
          {
            leftValue: expr('={{ $json.hay_destinatarios }}'),
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
        combinator: 'and',
      },
    },
  },
});

const enviarResumen = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Enviar resumen',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: 'https://api.resend.com/emails',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("={{ JSON.stringify({ from: 'onboarding@resend.dev', to: $json.destinatarios, subject: $json.asunto, text: $json.texto }) }}"),
      options: { timeout: 20000 },
    },
    credentials: { httpTemplatedCustomAuth: credencialResend },
  },
});

// --- Flujo 3: aviso antes de incumplir un SLA --------------------------------

const leerAvisosSla = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Leer avisos de SLA',
    parameters: {
      method: 'GET',
      url: `${CRM}/api/n8n/avisos-sla`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      options: { timeout: 15000 },
    },
    credentials: { httpTemplatedCustomAuth: credencialCrm },
  },
});

const hayRiesgo = ifElse({
  version: 2.3,
  config: {
    name: '¿Hay incidencias en riesgo?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [
          {
            leftValue: expr('={{ $json.total }}'),
            operator: { type: 'number', operation: 'gt' },
            rightValue: 0,
          },
        ],
        combinator: 'and',
      },
    },
  },
});

const componerAviso = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Componer aviso de SLA',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `// Un solo aviso con todas las incidencias en riesgo, no uno por cada una.
const d = $input.first().json;
const incidencias = d.incidencias || [];

const lineas = [
  'Incidencias con el compromiso de servicio en riesgo',
  '',
  'Vencidas: ' + (d.vencidas || 0) + ' de ' + (d.total || 0) + '.',
  '',
];

for (const i of incidencias) {
  const horas = Number(i.horas_restantes || 0);
  const estado = horas < 0
    ? 'VENCIDA hace ' + Math.abs(horas).toFixed(1) + ' h'
    : 'vence en ' + horas.toFixed(1) + ' h';
  lineas.push('  · ' + i.referencia + ' — ' + i.razon_social + ' — ' + i.prioridad + ' — ' + estado + ' — ' + (i.asignado || 'sin asignar'));
}

return [{
  json: {
    asunto: 'crmbas · ' + (d.total || 0) + ' incidencia(s) con el SLA en riesgo',
    texto: lineas.join('\\n'),
  },
}];`,
    },
  },
});

const enviarAvisoSla = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Enviar aviso de SLA',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: 'https://api.resend.com/emails',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("={{ JSON.stringify({ from: 'onboarding@resend.dev', to: ['onboarding@resend.dev'], subject: $json.asunto, text: $json.texto }) }}"),
      options: { timeout: 20000 },
    },
    credentials: { httpTemplatedCustomAuth: credencialResend },
  },
});

export default workflow('wf-crmbas', 'wf-crmbas')
  .add(avisoDeCrmbas)
  .to(leerCola)
  .to(separarPendientes)
  .to(entregarConResend)
  .to(comunicarResultado)

  .add(cadaQuinceMinutos)
  .to(leerCola)

  .add(cadaManana)
  .to(leerResumen)
  .to(componerResumen)
  .to(hayEquipo.onTrue(enviarResumen))

  .add(cadaHora)
  .to(leerAvisosSla)
  .to(hayRiesgo.onTrue(componerAviso.to(enviarAvisoSla)));
