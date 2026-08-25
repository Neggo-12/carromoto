import { Link } from "react-router-dom";
import { LegalPageLayout, Seccion, Pendiente } from "@/components/legal/LegalPageLayout";

// Debe mantenerse alineado con legal/CONDICIONES_PUNTOS.md — ver
// legal/README.md sobre cómo mantener ambos lados sincronizados.
//
// El valor del punto, el mínimo de redención y la vigencia vienen del modelo
// económico REAL ya decidido para el sistema unificado de Puntos (ver
// puntos-neggo/docs/modelo-economico-v1.md, definido por Jhey el 17 ago
// 2026) — no son un número inventado acá. Lo único pendiente es la fecha en
// que Tallergo se conecte de verdad a ese sistema (ver sección 2).
export const VERSION_CONDICIONES_PUNTOS = "1.0";

export default function CondicionesPuntos() {
  return (
    <LegalPageLayout titulo="Condiciones de Puntos" version={VERSION_CONDICIONES_PUNTOS} vigenteDesde="25 de agosto de 2026">
      <Seccion titulo="1. Cómo se ganan puntos hoy en Tallergo">
        <p>
          Actualmente hay dos formas de ganar puntos en Tallergo, y las dos son campañas que el administrador puede
          activar o desactivar en cualquier momento:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-foreground">Puntos de bienvenida:</strong> se otorgan una sola vez, al completar
            el registro, mientras la campaña esté activa. No aplican a cuentas que ya existían antes de activarse.
          </li>
          <li>
            <strong className="text-foreground">Puntos por referir:</strong> cada cliente tiene un código propio para
            compartir. Cuando alguien se registra usando ese código, quien invitó gana puntos, una sola vez por cada
            persona referida, mientras la campaña de referidos esté activa.
          </li>
        </ul>
        <p>La cantidad exacta de puntos de cada campaña puede cambiar — se muestra siempre en el momento en que se otorgan.</p>
      </Seccion>

      <Seccion titulo="2. Puntos por compras en un taller">
        <p>
          Tallergo también está preparado para que un cliente gane puntos al pagar un servicio o producto en un
          taller afiliado (el taller ya genera un comprobante por cada venta). Esos puntos dependen de la conexión
          con Puntos, el sistema unificado de puntos de todo el ecosistema (Neggo, Talleres y futuros proyectos) —
          esa conexión todavía no está activa, así que hoy esos puntos no se otorgan de verdad. Las reglas de las
          secciones 3 a 5 son las que ya están decididas para ese sistema y aplicarán también acá en cuanto la
          conexión esté lista: <Pendiente>fecha de activación de la integración con Puntos</Pendiente>.
        </p>
      </Seccion>

      <Seccion titulo="3. Valor de cada punto y mínimo para redimir">
        <p>
          <strong className="text-foreground">$800</strong> de compra equivalen a <strong className="text-foreground">1 punto</strong>, y{" "}
          <strong className="text-foreground">1 punto equivale a $10</strong> de valor de referencia (una recompensa
          base de 1,25%). Ese valor puede subir según el tipo de compra — por ejemplo, campañas activas de un taller
          o ser cliente nuevo de ese taller aumentan los puntos ganados por la misma compra, pero nunca se suman
          varios aumentos entre sí, se aplica siempre el más alto que corresponda.
        </p>
        <p>
          El mínimo para poder redimir puntos es de <strong className="text-foreground">200 puntos</strong> (equivalentes a $2.000).
        </p>
      </Seccion>

      <Seccion titulo="4. Cómo se redimen los puntos">
        <p>
          La redención se pide desde la plataforma: al confirmar un canje, el saldo se descuenta de inmediato (para
          que no se pueda redimir dos veces el mismo saldo) y se genera un código de verificación que llega por
          correo o mensaje de texto. El comercio le entrega el producto o servicio al cliente solo si este le dice
          ese código correctamente — el mismo mecanismo anti-fraude que ya usa Tallergo para "Contactar al taller".
          Se puede combinar el pago con puntos y con dinero en la misma compra; los puntos nuevos que gane esa compra
          se calculan solo sobre la parte pagada en dinero real, nunca sobre la parte pagada con puntos.
        </p>
      </Seccion>

      <Seccion titulo="5. Vigencia">
        <p>
          Cada punto ganado vence <strong className="text-foreground">12 meses después de la fecha en que se otorgó</strong>,
          no todo el saldo junto — cada tanda de puntos tiene su propia fecha de vencimiento, y al redimir se
          consumen primero los puntos más antiguos. La plataforma debe avisar antes de que una tanda de puntos esté
          por vencer.
        </p>
      </Seccion>

      <Seccion titulo="6. Cambios a estas condiciones">
        <p>
          Tallergo puede activar, modificar o desactivar campañas de puntos en cualquier momento, sin que eso afecte
          los puntos que ya se hayan otorgado. Cambios a estas Condiciones de Puntos se reflejan actualizando la
          versión y la fecha de vigencia en esta misma página.
        </p>
        <p>
          Ver también los{" "}
          <Link to="/legal/terminos" className="font-bold text-brand-600 hover:underline">
            Términos y Condiciones
          </Link>
          .
        </p>
      </Seccion>
    </LegalPageLayout>
  );
}
