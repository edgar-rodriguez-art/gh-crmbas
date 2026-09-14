import Link from "next/link";

export const metadata = { title: "Información de privacidad" };

const SECCIONES = [
  {
    titulo: "Responsable del tratamiento",
    texto:
      "La organización que explota esta instancia de crmbas. Sus datos identificativos " +
      "y de contacto, incluido el del delegado de protección de datos cuando exista, " +
      "figuran en el aviso legal.",
  },
  {
    titulo: "Qué datos se tratan",
    texto:
      "Datos identificativos y de contacto profesional de clientes y de sus personas " +
      "de contacto, datos económicos y de facturación, y el historial de la relación " +
      "comercial y del servicio técnico. No se tratan categorías especiales de datos.",
  },
  {
    titulo: "Con qué finalidad y con qué base jurídica",
    texto:
      "La gestión de la relación contractual, la elaboración de ofertas y el servicio " +
      "postventa se amparan en la ejecución del contrato (artículo 6.1.b del RGPD). " +
      "El envío de comunicaciones comerciales electrónicas requiere consentimiento " +
      "previo (artículo 6.1.a del RGPD y artículo 21 de la Ley 34/2002), que puede " +
      "retirarse en cualquier momento sin que ello afecte a la licitud del tratamiento " +
      "anterior.",
  },
  {
    titulo: "Durante cuánto tiempo",
    texto:
      "Los datos de clientes se conservan seis años desde la última operación, plazo " +
      "que impone el artículo 30 del Código de Comercio para la documentación mercantil. " +
      "Los consentimientos se conservan mientras estén vigentes y tres años más a " +
      "efectos probatorios. Transcurridos los plazos, los datos se suprimen.",
  },
  {
    titulo: "A quién se comunican",
    texto:
      "Al proveedor de alojamiento de la base de datos, al proveedor de automatización " +
      "de flujos y al proveedor de correo transaccional, todos ellos encargados del " +
      "tratamiento con contrato conforme al artículo 28 del RGPD. También a la " +
      "asesoría fiscal y a la Administración tributaria cuando así lo exija una norma.",
  },
  {
    titulo: "Dónde se alojan",
    texto:
      "La base de datos reside en la región eu-west-3 (París), dentro de la Unión " +
      "Europea. No se realizan transferencias internacionales de datos.",
  },
  {
    titulo: "Qué derechos asisten a las personas interesadas",
    texto:
      "Acceso, rectificación, supresión, limitación del tratamiento, portabilidad y " +
      "oposición, así como no ser objeto de decisiones individuales automatizadas. " +
      "Pueden ejercerse dirigiéndose al responsable, que responderá en el plazo de un " +
      "mes desde la recepción de la solicitud (artículo 12.3 del RGPD). Toda solicitud " +
      "queda registrada en el sistema con su plazo de vencimiento.",
  },
  {
    titulo: "Reclamación ante la autoridad de control",
    texto:
      "Si considera que el tratamiento no se ajusta a la normativa, puede presentar una " +
      "reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).",
  },
];

export default function PaginaPrivacidad() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="inline-flex items-center rounded-lg bg-marca-600 px-2.5 py-1 text-sm font-bold text-white">
        crmbas
      </p>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Información sobre el tratamiento de datos personales
      </h1>
      <p className="texto-suave mt-2 text-sm">
        Reglamento (UE) 2016/679 y Ley Orgánica 3/2018 de Protección de Datos Personales
        y garantía de los derechos digitales.
      </p>

      <div className="mt-10 space-y-8">
        {SECCIONES.map((seccion) => (
          <section key={seccion.titulo}>
            <h2 className="text-sm font-semibold">{seccion.titulo}</h2>
            <p className="mt-2 text-sm leading-relaxed">{seccion.texto}</p>
          </section>
        ))}
      </div>

      <p className="texto-suave mt-12 text-xs">
        <Link href="/entrar" className="underline">Volver al acceso</Link> ·{" "}
        <Link href="/aviso-legal" className="underline">Aviso legal</Link>
      </p>
    </main>
  );
}
