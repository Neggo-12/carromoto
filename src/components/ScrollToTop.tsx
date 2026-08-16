import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router no resetea el scroll al navegar entre rutas — si venías
 * desplazado hacia abajo en una página, la siguiente carga en ese mismo
 * punto (a veces cerca del final). Este componente fuerza scroll al tope
 * en cada cambio de ruta, como se espera de un sitio normal.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
