import Link from "next/link";

export const metadata = { title: "Aviso legal" };

export default function PaginaAvisoLegal() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="inline-flex items-center rounded-lg bg-marca-600 px-2.5 py-1 text-sm font-bold text-white">
        crmbas
      </p>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Aviso legal</h1>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-sm font-semibold">Titularidad</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Conforme al artículo 10 de la Ley 34/2002 de servicios de la sociedad de la
            información y de comercio electrónico, la organización que explota esta
            instancia debe hacer constar aquí su denominación social, su NIF, su
            domicilio y una dirección de contacto, junto con los datos de inscripción
            registral cuando proceda.
          </p>
          <p className="texto-suave mt-2 text-sm">
            Estos datos se completan durante la puesta en marcha de la instancia.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold">Objeto</h2>
          <p className="mt-2 text-sm leading-relaxed">
            crmbas es una herramienta interna de gestión comercial y de servicio técnico.
            El acceso está restringido a las personas autorizadas de la organización y
            requiere credenciales nominativas. No se trata de un servicio abierto al
            público.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold">Uso aceptable</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Las credenciales son personales e intransferibles. Toda operación queda
            registrada en la traza de auditoría con la identidad de quien la realiza.
            El uso de la información contenida en el sistema para fines ajenos a la
            actividad de la organización puede acarrear responsabilidad disciplinaria,
            civil o penal.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold">Cookies</h2>
          <p className="mt-2 text-sm leading-relaxed">
            La aplicación emplea únicamente cookies técnicas necesarias para mantener la
            sesión iniciada. Al ser imprescindibles para prestar el servicio solicitado,
            están exceptuadas del deber de consentimiento previsto en el artículo 22.2
            de la Ley 34/2002. No se utilizan cookies analíticas, publicitarias ni de
            terceros.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold">Propiedad intelectual</h2>
          <p className="mt-2 text-sm leading-relaxed">
            El código fuente de la aplicación y su documentación se distribuyen en el
            repositorio del proyecto. Los datos tratados pertenecen a la organización
            titular de la instancia.
          </p>
        </section>
      </div>

      <p className="texto-suave mt-12 text-xs">
        <Link href="/entrar" className="underline">Volver al acceso</Link> ·{" "}
        <Link href="/privacidad" className="underline">Información de privacidad</Link>
      </p>
    </main>
  );
}
