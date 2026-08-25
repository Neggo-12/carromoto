import { Link } from "react-router-dom";
import { LegalPageLayout, Seccion, Pendiente } from "@/components/legal/LegalPageLayout";
import { VERSION_TRATAMIENTO_DATOS } from "@/lib/legal";

// Debe reflejar exactamente legal/POLITICA_TRATAMIENTO_DATOS.md — ver
// legal/README.md sobre cómo mantener ambos lados sincronizados.
export default function Privacidad() {
  return (
    <LegalPageLayout
      titulo="Política de Tratamiento de Datos y Aviso de Privacidad"
      version={VERSION_TRATAMIENTO_DATOS}
      vigenteDesde="25 de agosto de 2026"
    >
      <p className="text-muted-foreground">
        Esta política se rige por la Ley 1581 de 2012, su decreto reglamentario (Decreto 1074 de 2015) y los criterios de
        la Superintendencia de Industria y Comercio (SIC), autoridad de vigilancia en materia de protección de datos
        personales en Colombia.
      </p>

      <Seccion titulo="1. Responsable del Tratamiento">
        <p>
          <Pendiente>razón social, NIT y domicilio de la sociedad que opera Tallergo</Pendiente>. Canal de contacto para
          ejercer sus derechos: <Pendiente>correo o formulario oficial</Pendiente>. Hasta que este dato se complete, esta
          Política opera como borrador funcional.
        </p>
      </Seccion>

      <Seccion titulo="2. Qué datos recolectamos">
        <p>Según el tipo de cuenta, recolectamos:</p>
        <p>
          <strong className="text-foreground">Clientes:</strong> nombre, correo electrónico, celular/WhatsApp, ciudad,
          tipo de vehículo (carro, moto o ambos) y su motorización (eléctrico, híbrido o combustión). Opcionalmente, tipo
          y número de documento cuando se requiere para generar un comprobante.
        </p>
        <p>
          <strong className="text-foreground">Talleres/almacenes:</strong> nombre del encargado, correo, celular, nombre
          del negocio, tipo de negocio, ciudad, dirección, barrio, descripción del negocio, y los datos de geolocalización
          que resultan de geocodificar esa dirección.
        </p>
        <p>
          <strong className="text-foreground">Datos de uso:</strong> solicitudes de contacto entre cliente y taller,
          reservas de campañas, comprobantes generados por el taller, y eventos básicos de uso de la plataforma.
        </p>
        <p>
          No recolectamos datos biométricos, de salud, ni categorías sensibles. No recolectamos datos de menores de edad
          — el registro está dirigido a personas mayores de edad.
        </p>
      </Seccion>

      <Seccion titulo="3. Para qué usamos sus datos (finalidad)">
        <p>
          Crear y administrar su cuenta, y verificar la identidad del taller antes de otorgarle el Sello de Confianza;
          mostrarle talleres relevantes según su ciudad y tipo de vehículo, y mostrarle al taller las solicitudes de
          contacto y reservas de campaña que le correspondan; generar el código de verificación que confirma que un
          contacto proviene realmente del taller correspondiente; calcular y comunicar puntos o beneficios de campañas
          cuando estén activas; y comunicarnos con usted sobre el estado de su cuenta, sus solicitudes o cambios
          relevantes del servicio.
        </p>
        <p>No usamos sus datos para finalidades de marketing de terceros ni los vendemos.</p>
      </Seccion>

      <Seccion titulo="4. Base jurídica y autorización">
        <p>
          El tratamiento de sus datos se realiza con base en la autorización que usted otorga expresamente al marcar la
          casilla de tratamiento de datos en el formulario de registro — separada de la aceptación de los Términos y
          Condiciones, conforme lo exige la ley. Guardamos evidencia de esa autorización: quién la dio, cuándo, y con qué
          versión de esta Política, en un registro que no se modifica ni se borra.
        </p>
      </Seccion>

      <Seccion titulo="5. Con quién compartimos sus datos">
        <p>
          <strong className="text-foreground">Entre cliente y taller:</strong> cuando usted contacta a un taller o
          reserva una campaña, el taller recibe los datos necesarios para atenderlo (nombre, teléfono/WhatsApp, y el
          detalle de lo que necesita).
        </p>
        <p>
          <strong className="text-foreground">Proveedores de infraestructura:</strong> la plataforma corre sobre
          Supabase (base de datos y autenticación) y se despliega en un proveedor de hosting. Estos proveedores procesan
          los datos por cuenta nuestra, no para fines propios. No compartimos sus datos con terceros para fines
          publicitarios.
        </p>
        <p>
          Cuando la integración con el sistema de puntos de Grupo Neggo esté activa, esta política se actualizará para
          reflejar exactamente qué datos se envían a ese sistema y con qué finalidad — hoy esa integración no está
          conectada y no se envía ningún dato a ese sistema.
        </p>
      </Seccion>

      <Seccion titulo="6. Dónde se almacenan sus datos">
        <p>
          Sus datos se almacenan en la infraestructura de Supabase.{" "}
          <Pendiente>confirmar la región/país de alojamiento del proyecto de Supabase usado en producción</Pendiente>.
        </p>
      </Seccion>

      <Seccion titulo="7. Cuánto tiempo conservamos sus datos">
        <p>
          Conservamos sus datos mientras su cuenta esté activa y por el tiempo adicional necesario para cumplir
          obligaciones legales, contables o de defensa ante reclamos. Si solicita la eliminación de su cuenta,
          eliminamos o anonimizamos los datos que ya no sean necesarios para esos fines, conforme a la solicitud que nos
          haga llegar por el canal de contacto indicado en la sección 1.
        </p>
      </Seccion>

      <Seccion titulo="8. Sus derechos (Hábeas Data)">
        <p>Como titular de sus datos personales, usted tiene derecho a:</p>
        <p>
          Conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización que otorgó; ser informado
          sobre el uso que le hemos dado a sus datos; presentar quejas ante la Superintendencia de Industria y Comercio
          por infracciones a la ley; revocar la autorización y/o solicitar la supresión de sus datos, cuando no exista
          un deber legal o contractual que impida eliminarlos; y acceder gratuitamente a sus datos.
        </p>
        <p>
          Para ejercer cualquiera de estos derechos, escriba a <Pendiente>canal de contacto</Pendiente>. Hoy la
          plataforma no tiene un módulo dedicado de solicitudes; la solicitud se atiende manualmente por ese canal
          mientras ese módulo no exista.
        </p>
      </Seccion>

      <Seccion titulo="9. Seguridad">
        <p>
          Aplicamos controles razonables para proteger sus datos: acceso restringido por rol dentro de la plataforma
          (Row Level Security en la base de datos, para que cada cuenta solo pueda ver la información que le
          corresponde), contraseñas gestionadas por el proveedor de autenticación (nunca las vemos en texto plano), y
          separación entre el proyecto de Tallergo y otros proyectos del mismo grupo (Neggo, Puntos Neggo).
        </p>
      </Seccion>

      <Seccion titulo="10. Menores de edad">
        <p>
          Este servicio está dirigido a personas mayores de edad. Si detectamos una cuenta registrada por un menor, la
          desactivaremos.
        </p>
      </Seccion>

      <Seccion titulo="11. Cambios a esta Política">
        <p>
          Podemos actualizar esta Política cuando cambien las condiciones del tratamiento. La versión vigente siempre
          está publicada en esta misma página, con su fecha de vigencia.
        </p>
      </Seccion>

      <p className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-xs leading-relaxed text-amber-800">
        Este documento es un borrador funcional preparado para habilitar el flujo de registro con consentimiento
        explícito conforme a la Ley 1581 de 2012. Antes de considerarse definitivo, debe completarse la sección 1 y
        pasar por revisión de un abogado. Vea también los{" "}
        <Link to="/legal/terminos" className="font-bold underline">
          Términos y Condiciones
        </Link>
        .
      </p>
    </LegalPageLayout>
  );
}
