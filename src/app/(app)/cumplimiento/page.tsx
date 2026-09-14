import { FormularioSolicitudRgpd, PanelResolucionRgpd } from "@/components/formulario-rgpd";
import { Aviso, Dato, Encabezado, Etiqueta, SinDatos, Tarjeta } from "@/components/ui";
import {
  ETIQUETA_BASE_LEGAL, ETIQUETA_ESTADO_RGPD, ETIQUETA_FINALIDAD, ETIQUETA_TIPO_RGPD,
} from "@/lib/dominio";
import { fecha } from "@/lib/formato";
import { esAdmin, exigirSesion, puedeEditar } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { Consentimiento, SolicitudRgpd, Tratamiento } from "@/lib/tipos";

export const metadata = { title: "Protección de datos" };
export const dynamic = "force-dynamic";

export default async function PaginaCumplimiento() {
  const perfil = await exigirSesion();
  const supabase = await crearClienteServidor();

  const [solicitudesRes, tratamientosRes, consentimientosRes, cuentasRes] = await Promise.all([
    supabase.from("solicitudes_rgpd").select("*").order("fecha_solicitud", { ascending: false }),
    supabase.from("tratamientos").select("*").order("codigo"),
    supabase
      .from("consentimientos")
      .select("*, contactos(nombre, apellidos)")
      .order("fecha_otorgamiento", { ascending: false }),
    supabase.from("cuentas").select("id, razon_social").eq("estado", "activo").order("razon_social"),
  ]);

  const solicitudes = (solicitudesRes.data ?? []) as SolicitudRgpd[];
  const tratamientos = (tratamientosRes.data ?? []) as Tratamiento[];
  const consentimientos = (consentimientosRes.data ?? []) as (Consentimiento & {
    contactos: { nombre: string; apellidos: string } | null;
  })[];

  const hoy = new Date().toISOString().slice(0, 10);
  const fueraDePlazo = solicitudes.filter(
    (s) => ["recibida", "en_tramite"].includes(s.estado) && s.fecha_limite < hoy,
  );

  return (
    <>
      <Encabezado
        titulo="Protección de datos"
        descripcion="Derechos de las personas interesadas, consentimientos y registro de actividades de tratamiento."
      />

      {fueraDePlazo.length > 0 && (
        <div className="mb-6">
          <Aviso tono="rojo" titulo={`${fueraDePlazo.length} solicitud(es) fuera de plazo`}>
            El artículo 12.3 del RGPD fija un mes para responder desde la recepción.
            La prórroga de dos meses adicionales debe comunicarse y motivarse.
          </Aviso>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tarjeta
            titulo="Solicitudes de derechos"
            descripcion="Acceso, rectificación, supresión, limitación, portabilidad y oposición."
            sinRelleno
          >
            {solicitudes.length === 0 ? (
              <SinDatos mensaje="No se ha recibido ninguna solicitud." />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--borde)" }}>
                {solicitudes.map((s) => {
                  const pendiente = ["recibida", "en_tramite"].includes(s.estado);
                  const vencida = pendiente && s.fecha_limite < hoy;

                  return (
                    <li key={s.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-xs">{s.referencia}</p>
                          <p className="mt-0.5 text-sm font-medium">{ETIQUETA_TIPO_RGPD[s.tipo]}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Etiqueta tono={s.estado === "completada" ? "verde" : pendiente ? "azul" : "neutro"}>
                            {ETIQUETA_ESTADO_RGPD[s.estado]}
                          </Etiqueta>
                          {pendiente && (
                            <Etiqueta tono={vencida ? "rojo" : "ambar"}>
                              Plazo: {fecha(s.fecha_limite)}
                            </Etiqueta>
                          )}
                        </div>
                      </div>

                      <p className="mt-2 text-sm">{s.descripcion}</p>
                      <p className="texto-suave mt-1 text-xs">
                        {s.solicitante_email} · recibida el {fecha(s.fecha_solicitud)} ·{" "}
                        {s.identidad_verificada ? "identidad verificada" : "identidad sin verificar"}
                      </p>

                      {s.resolucion && (
                        <p className="texto-suave mt-2 text-xs">
                          <strong>Resolución:</strong> {s.resolucion} ({fecha(s.fecha_resolucion)})
                        </p>
                      )}

                      {esAdmin(perfil) && pendiente && <PanelResolucionRgpd id={s.id} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </Tarjeta>

          <Tarjeta
            titulo="Registro de actividades de tratamiento"
            descripcion="Documento exigido por el artículo 30 del RGPD."
            sinRelleno
          >
            <ul className="divide-y" style={{ borderColor: "var(--borde)" }}>
              {tratamientos.map((t) => (
                <li key={t.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{t.nombre}</p>
                    <Etiqueta tono="violeta">{t.codigo}</Etiqueta>
                  </div>
                  <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Dato rotulo="Finalidad">{t.finalidad}</Dato>
                    <Dato rotulo="Base jurídica">{ETIQUETA_BASE_LEGAL[t.base_legal]}</Dato>
                    <Dato rotulo="Categorías de interesados">
                      {t.categorias_interesados.join(", ")}
                    </Dato>
                    <Dato rotulo="Categorías de datos">{t.categorias_datos.join(", ")}</Dato>
                    <Dato rotulo="Destinatarios">{t.destinatarios.join(", ")}</Dato>
                    <Dato rotulo="Plazo de conservación">{t.plazo_conservacion}</Dato>
                    <Dato rotulo="Transferencias internacionales">
                      {t.transferencias_internacionales ?? "No se realizan"}
                    </Dato>
                    <Dato rotulo="Medidas de seguridad">{t.medidas_seguridad}</Dato>
                  </dl>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>

        <div className="space-y-6">
          {puedeEditar(perfil) && (
            <Tarjeta titulo="Registrar una solicitud">
              <FormularioSolicitudRgpd
                cuentas={(cuentasRes.data ?? []) as { id: string; razon_social: string }[]}
              />
            </Tarjeta>
          )}

          <Tarjeta
            titulo="Consentimientos"
            descripcion="Prueba conservada conforme al artículo 7.1 del RGPD."
            sinRelleno
          >
            {consentimientos.length === 0 ? (
              <SinDatos mensaje="Sin consentimientos registrados." />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--borde)" }}>
                {consentimientos.map((c) => (
                  <li key={c.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm">
                        {c.contactos ? `${c.contactos.nombre} ${c.contactos.apellidos}` : "Cliente"}
                      </span>
                      <Etiqueta tono={c.otorgado && !c.fecha_revocacion ? "verde" : "rojo"}>
                        {c.fecha_revocacion ? "Revocado" : c.otorgado ? "Otorgado" : "Denegado"}
                      </Etiqueta>
                    </div>
                    <p className="texto-suave mt-1 text-xs">
                      {ETIQUETA_FINALIDAD[c.finalidad]} · {fecha(c.fecha_otorgamiento)} · {c.canal}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
