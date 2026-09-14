"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { encolarCorreo } from "@/lib/n8n";
import { exigirSesion, puedeEditar } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import {
  desdeFormulario, esquemaActividad, esquemaContacto, esquemaCuenta,
  esquemaIncidencia, esquemaOportunidad, esquemaSolicitudRgpd, primerError,
} from "@/lib/validacion";

/**
 * Acciones de servidor.
 *
 * Cada una vuelve a comprobar la sesión y el rol: la ocultación de un botón en
 * la interfaz es comodidad, no control de acceso. La autorización definitiva la
 * ejerce RLS en la base de datos, y esta capa evita además que un envío inválido
 * llegue siquiera a intentarse.
 */

export interface EstadoAccion {
  error?: string;
  exito?: string;
}

const SIN_PERMISO: EstadoAccion = {
  error: "Tu rol no permite realizar esta operación.",
};

// -----------------------------------------------------------------------------
// Clientes
// -----------------------------------------------------------------------------

export async function crearCuenta(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const analisis = esquemaCuenta.safeParse(desdeFormulario(datos));
  if (!analisis.success) return { error: primerError(analisis.error) };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("cuentas")
    .insert({ ...analisis.data, propietario_id: perfil.id, creado_por: perfil.id })
    .select("id")
    .single();

  if (error) {
    return {
      error: error.code === "23505"
        ? "Ya existe un cliente con ese NIF."
        : `No se ha podido guardar: ${error.message}`,
    };
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function actualizarCuenta(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const id = String(datos.get("id") ?? "");
  const analisis = esquemaCuenta.safeParse(desdeFormulario(datos));
  if (!analisis.success) return { error: primerError(analisis.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("cuentas").update(analisis.data).eq("id", id);
  if (error) return { error: `No se ha podido guardar: ${error.message}` };

  revalidatePath(`/clientes/${id}`);
  return { exito: "Cliente actualizado." };
}

export async function cambiarEstadoCuenta(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const id = String(datos.get("id") ?? "");
  const estado = String(datos.get("estado") ?? "activo");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("cuentas").update({ estado }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { exito: estado === "archivado" ? "Cliente archivado." : "Cliente reactivado." };
}

export async function crearContacto(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const analisis = esquemaContacto.safeParse(desdeFormulario(datos));
  if (!analisis.success) return { error: primerError(analisis.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("contactos").insert(analisis.data);
  if (error) {
    return {
      error: error.code === "23505"
        ? "Ya hay un contacto principal para este cliente."
        : error.message,
    };
  }

  // Sin consentimiento no se envía nada: el artículo 21 de la LSSI-CE exige
  // autorización previa para la comunicación comercial electrónica.
  if (analisis.data.acepta_comunicaciones && analisis.data.email) {
    await encolarCorreo({
      plantilla: "bienvenida_cliente",
      destinatario: analisis.data.email,
      asunto: "Te damos la bienvenida",
      cuerpoTexto:
        `Hola ${analisis.data.nombre}: hemos registrado tus datos de contacto. ` +
        "Puedes darte de baja de nuestras comunicaciones en cualquier momento.",
      cuentaId: analisis.data.cuenta_id,
    });
  }

  revalidatePath(`/clientes/${analisis.data.cuenta_id}`);
  return { exito: "Contacto añadido." };
}

// -----------------------------------------------------------------------------
// Oportunidades
// -----------------------------------------------------------------------------

export async function crearOportunidad(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const analisis = esquemaOportunidad.safeParse(desdeFormulario(datos));
  if (!analisis.success) return { error: primerError(analisis.error) };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .insert({ ...analisis.data, propietario_id: perfil.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/oportunidades");
  redirect(`/oportunidades/${data.id}`);
}

export async function cambiarEtapa(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const id = String(datos.get("id") ?? "");
  const etapa = String(datos.get("etapa") ?? "");
  const motivo = String(datos.get("motivo_perdida") ?? "").trim();
  const probabilidad = Number(datos.get("probabilidad") ?? 0);

  if (etapa === "perdida" && motivo.length < 3) {
    return { error: "Indica el motivo por el que se ha perdido la oportunidad." };
  }

  const cambios: Record<string, unknown> = {
    etapa,
    probabilidad,
    motivo_perdida: etapa === "perdida" ? motivo : null,
    fecha_cierre_real:
      etapa === "ganada" || etapa === "perdida"
        ? new Date().toISOString().slice(0, 10)
        : null,
  };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .update(cambios)
    .eq("id", id)
    .select("referencia, titulo, importe_estimado, cuenta_id, contactos(email, nombre)")
    .single();

  if (error) return { error: error.message };

  if (etapa === "ganada") {
    const contacto = data.contactos as { email?: string; nombre?: string } | null;
    if (contacto?.email) {
      await encolarCorreo({
        plantilla: "oportunidad_ganada",
        destinatario: contacto.email,
        asunto: `Confirmamos el pedido · ${data.titulo}`,
        cuerpoTexto:
          `Hola ${contacto.nombre ?? ""}: confirmamos la aceptación de la propuesta ` +
          `${data.referencia}. En breve te haremos llegar el calendario de entrega.`,
        cuentaId: data.cuenta_id,
        oportunidadId: id,
      });
    }
  }

  revalidatePath("/oportunidades");
  revalidatePath(`/oportunidades/${id}`);
  revalidatePath("/embudo");
  return { exito: "Etapa actualizada." };
}

export async function registrarActividad(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const analisis = esquemaActividad.safeParse(desdeFormulario(datos));
  if (!analisis.success) return { error: primerError(analisis.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("actividades")
    .insert({ ...analisis.data, usuario_id: perfil.id });

  if (error) return { error: error.message };

  if (analisis.data.oportunidad_id) revalidatePath(`/oportunidades/${analisis.data.oportunidad_id}`);
  if (analisis.data.cuenta_id) revalidatePath(`/clientes/${analisis.data.cuenta_id}`);
  revalidatePath("/");
  return { exito: "Actividad registrada." };
}

// -----------------------------------------------------------------------------
// Presupuestos
// -----------------------------------------------------------------------------

export async function emitirPresupuesto(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const id = String(datos.get("id") ?? "");
  const supabase = await crearClienteServidor();

  // El disparador `sellar_presupuesto` calcula la huella al abandonar el borrador.
  const { data, error } = await supabase
    .from("presupuestos")
    .update({ estado: "enviado" })
    .eq("id", id)
    .eq("estado", "borrador")
    .select("numero, total, cuenta_id, cuentas(razon_social, email)")
    .single();

  if (error) return { error: `No se ha podido emitir: ${error.message}` };

  const cuenta = data.cuentas as { razon_social?: string; email?: string } | null;
  if (cuenta?.email) {
    await encolarCorreo({
      plantilla: "presupuesto_enviado",
      destinatario: cuenta.email,
      asunto: `Presupuesto ${data.numero}`,
      cuerpoTexto:
        `Hola: adjuntamos el presupuesto ${data.numero}, por un importe total de ` +
        `${data.total} €, IVA incluido. Quedamos a tu disposición.`,
      cuentaId: data.cuenta_id,
      presupuestoId: id,
    });
  }

  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${id}`);
  return { exito: `Presupuesto ${data.numero} emitido y sellado.` };
}

export async function cambiarEstadoPresupuesto(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const id = String(datos.get("id") ?? "");
  const estado = String(datos.get("estado") ?? "");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("presupuestos").update({ estado }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/presupuestos/${id}`);
  revalidatePath("/presupuestos");
  return { exito: "Estado del presupuesto actualizado." };
}

// -----------------------------------------------------------------------------
// Incidencias
// -----------------------------------------------------------------------------

export async function crearIncidencia(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const analisis = esquemaIncidencia.safeParse(desdeFormulario(datos));
  if (!analisis.success) return { error: primerError(analisis.error) };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("incidencias")
    .insert({ ...analisis.data, asignado_a: perfil.id })
    .select("id, referencia, contactos(email, nombre)")
    .single();

  if (error) return { error: error.message };

  const contacto = data.contactos as { email?: string; nombre?: string } | null;
  if (contacto?.email) {
    await encolarCorreo({
      plantilla: "incidencia_abierta",
      destinatario: contacto.email,
      asunto: `Incidencia ${data.referencia} registrada`,
      cuerpoTexto:
        `Hola ${contacto.nombre ?? ""}: hemos registrado tu incidencia con la ` +
        `referencia ${data.referencia}. Te informaremos de cada avance.`,
      cuentaId: analisis.data.cuenta_id,
      incidenciaId: data.id,
    });
  }

  revalidatePath("/incidencias");
  redirect(`/incidencias/${data.id}`);
}

export async function actualizarIncidencia(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const id = String(datos.get("id") ?? "");
  const estado = String(datos.get("estado") ?? "");
  const resolucion = String(datos.get("resolucion") ?? "").trim();

  if ((estado === "resuelta" || estado === "cerrada") && resolucion.length < 5) {
    return { error: "Describe la resolución antes de cerrar la incidencia." };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("incidencias")
    .update({ estado, resolucion: resolucion || null })
    .eq("id", id)
    .select("referencia, cuenta_id, contactos(email, nombre)")
    .single();

  if (error) return { error: error.message };

  if (estado === "resuelta") {
    const contacto = data.contactos as { email?: string; nombre?: string } | null;
    if (contacto?.email) {
      await encolarCorreo({
        plantilla: "incidencia_resuelta",
        destinatario: contacto.email,
        asunto: `Incidencia ${data.referencia} resuelta`,
        cuerpoTexto:
          `Hola ${contacto.nombre ?? ""}: damos por resuelta la incidencia ` +
          `${data.referencia}. Resolución: ${resolucion}`,
        cuentaId: data.cuenta_id,
        incidenciaId: id,
      });
    }
  }

  revalidatePath("/incidencias");
  revalidatePath(`/incidencias/${id}`);
  return { exito: "Incidencia actualizada." };
}

// -----------------------------------------------------------------------------
// Protección de datos
// -----------------------------------------------------------------------------

export async function registrarSolicitudRgpd(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (!puedeEditar(perfil)) return SIN_PERMISO;

  const analisis = esquemaSolicitudRgpd.safeParse(desdeFormulario(datos));
  if (!analisis.success) return { error: primerError(analisis.error) };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("solicitudes_rgpd")
    .insert({ ...analisis.data, gestor_id: perfil.id })
    .select("id, referencia, fecha_limite")
    .single();

  if (error) return { error: error.message };

  // Acuse de recibo: el RGPD exige informar del plazo de respuesta.
  await encolarCorreo({
    plantilla: "solicitud_rgpd_recibida",
    destinatario: analisis.data.solicitante_email,
    asunto: `Hemos recibido tu solicitud ${data.referencia}`,
    cuerpoTexto:
      `Hemos registrado tu solicitud con la referencia ${data.referencia}. ` +
      `Te responderemos antes del ${data.fecha_limite}, conforme al artículo 12.3 ` +
      "del Reglamento General de Protección de Datos.",
    cuentaId: analisis.data.cuenta_id,
  });

  revalidatePath("/cumplimiento");
  return { exito: `Solicitud ${data.referencia} registrada.` };
}

export async function resolverSolicitudRgpd(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (perfil.rol !== "admin") return SIN_PERMISO;

  const id = String(datos.get("id") ?? "");
  const estado = String(datos.get("estado") ?? "");
  const resolucion = String(datos.get("resolucion") ?? "").trim();

  if ((estado === "completada" || estado === "denegada") && resolucion.length < 5) {
    return { error: "Describe la resolución adoptada." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("solicitudes_rgpd")
    .update({
      estado,
      resolucion: resolucion || null,
      fecha_resolucion:
        estado === "completada" || estado === "denegada"
          ? new Date().toISOString().slice(0, 10)
          : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/cumplimiento");
  return { exito: "Solicitud actualizada." };
}

// -----------------------------------------------------------------------------
// Usuarios
// -----------------------------------------------------------------------------

export async function cambiarRol(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (perfil.rol !== "admin") return SIN_PERMISO;

  const id = String(datos.get("id") ?? "");
  const rol = String(datos.get("rol") ?? "");

  if (id === perfil.id) {
    return { error: "No puedes cambiar tu propio rol: pídeselo a otra persona administradora." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("perfiles").update({ rol }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return { exito: "Rol actualizado." };
}

export async function cambiarActivacionUsuario(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const perfil = await exigirSesion();
  if (perfil.rol !== "admin") return SIN_PERMISO;

  const id = String(datos.get("id") ?? "");
  const activo = datos.get("activo") === "true";

  if (id === perfil.id) return { error: "No puedes desactivar tu propia cuenta." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("perfiles").update({ activo }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return { exito: activo ? "Usuario reactivado." : "Usuario desactivado." };
}
