import { motion } from "framer-motion";
import type { ElementType, ReactNode } from "react";

/**
 * Envoltorio de fade-up al entrar en viewport — usado para que las
 * secciones aparezcan de forma escalonada al hacer scroll, en vez de
 * estar todas visibles de golpe. `once: true` para no repetir la
 * animación cada vez que se re-cruza el viewport. Polimórfico via `as`
 * (por defecto <div>, pero puede renderizar <section>, etc.) para no
 * tener que anidar un div extra dentro de cada <section>.
 */
export function Reveal({
  as = "div",
  children,
  delay = 0,
  className,
  ...rest
}: {
  as?: ElementType;
  children: ReactNode;
  delay?: number;
  className?: string;
  [key: string]: unknown;
}) {
  const Component = motion.create(as);
  return (
    <Component
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
}
