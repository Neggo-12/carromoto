import { Link } from "react-router-dom";
import { LegalPageLayout, Seccion, Pendiente } from "@/components/legal/LegalPageLayout";
import { VERSION_TERMINOS } from "@/lib/legal";

// Debe reflejar exactamente legal/TERMINOS_Y_CONDICIONES.md — ver
// legal/README.md sobre cómo mantener ambos lados sincronizados.
export default function Terminos() {
  return (
    <LegalPageLayout titulo="Términos y Condiciones de Uso" version={VERSION_TERMINOS} vigenteDesde="25 de agosto de 2026">
      <Seccion titulo="1. Quiénes somos">
        <p>
          Tallergo es una plataforma que conecta a personas dueñas de carro o moto con talleres y almacenes de repuestos
          verificados en Colombia.
        </p>
        <p>
          <strong className="text-foreground">Responsable:</strong> <Pendiente>razón social, NIT y domicilio de la sociedad que opera Tallergo</Pendiente>. Hasta que
          este dato se complete, estos Términos operan como borrador funcional.
        </p>
        <p>
          <strong className="text-foreground">Canal de contacto:</strong> <Pendiente>correo o canal oficial de atención</Pendiente>.
        </p>
      </Seccion>

      <Seccion titulo="2. Qué es Tallergo y qué no es">
        <p>
          Tallergo muestra información de talleres y almacenes que solicitaron su afiliación y que un administrador revisó
          antes de otorgarles el Sello de Confianza. Facilitamos el contacto entre el cliente y el taller, y mostramos las
          ofertas y campañas que cada taller decide publicar.
        </p>
        <p>
          Tallergo no presta servicios de mecánica ni de venta de repuestos directamente, no es parte del contrato de
          servicio o compra que el cliente celebre con el taller, y no garantiza la calidad, el precio ni el resultado del
          servicio prestado por un taller. El Sello de Confianza se otorga con base en la información que el taller
          declaró y que el equipo de Tallergo pudo confirmar razonablemente, pero no constituye una garantía absoluta.
        </p>
      </Seccion>

      <Seccion titulo="3. Cuentas de usuario">
        <p>
          Existen dos tipos de cuenta: Cliente (dueño de vehículo) y Taller (negocio afiliado). Cada persona es
          responsable de la veracidad de la información que registra y de mantener segura su contraseña. Una cuenta de
          Taller pasa por un proceso de aprobación antes de poder operar en el panel y de que sus ofertas sean visibles.
        </p>
      </Seccion>

      <Seccion titulo="4. Ofertas y campañas">
        <p>
          Los talleres pueden publicar ofertas y campañas con condiciones propias (por ejemplo, cupos limitados o
          multiplicadores de puntos). Tallergo muestra esa información tal como el taller la publicó; el cumplimiento de
          la oferta es responsabilidad del taller que la publicó. Cuando una campaña tiene cupo limitado, se cierra
          automáticamente al alcanzarse ese cupo.
        </p>
      </Seccion>

      <Seccion titulo="5. Puntos y beneficios">
        <p>
          Cuando la plataforma menciona puntos (por ejemplo, puntos de bienvenida al registrarse, o multiplicadores de
          puntos en una campaña), esos puntos se calculan y se muestran conforme a las reglas vigentes en cada momento, y
          su saldo real depende de la conexión con el sistema de puntos correspondiente. Tallergo puede activar,
          modificar o desactivar campañas de puntos en cualquier momento, sin que eso afecte los puntos ya otorgados
          antes del cambio.
        </p>
      </Seccion>

      <Seccion titulo="6. Código de verificación de contacto">
        <p>
          Cuando un cliente contacta a un taller a través de la plataforma, recibe un código de verificación único. Ese
          código sirve para confirmar que quien lo contacta por WhatsApp o teléfono es efectivamente el taller
          correspondiente. Si alguien pide dinero o datos personales sensibles antes de confirmar ese código,
          recomendamos no continuar la conversación y reportarlo.
        </p>
      </Seccion>

      <Seccion titulo="7. Conducta esperada">
        <p>
          No está permitido usar la plataforma para registrar información falsa, suplantar a otra persona o negocio, ni
          para fines distintos a los descritos en estos Términos.
        </p>
      </Seccion>

      <Seccion titulo="8. Disponibilidad del servicio">
        <p>
          Tallergo es un producto en construcción activa. Podemos agregar, modificar o descontinuar funcionalidades, y la
          plataforma puede no estar disponible en algún momento por mantenimiento o causas fuera de nuestro control.
        </p>
      </Seccion>

      <Seccion titulo="9. Cambios a estos Términos">
        <p>
          Podemos actualizar estos Términos cuando cambien las condiciones del servicio. La versión vigente siempre está
          publicada en esta misma página, con su fecha de vigencia. Los cambios de fondo no aplican retroactivamente a la
          aceptación ya registrada.
        </p>
      </Seccion>

      <Seccion titulo="10. Ley aplicable">
        <p>Estos Términos se rigen por la legislación de la República de Colombia.</p>
      </Seccion>

      <p className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-xs leading-relaxed text-amber-800">
        Este documento es un borrador funcional preparado para habilitar el flujo de registro con consentimiento
        explícito. Antes de considerarse definitivo, debe completarse la sección 1 y pasar por revisión de un abogado.
        Vea también la{" "}
        <Link to="/legal/privacidad" className="font-bold underline">
          Política de Tratamiento de Datos
        </Link>
        .
      </p>
    </LegalPageLayout>
  );
}
