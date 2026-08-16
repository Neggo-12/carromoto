import { forwardRef } from "react";
import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "brand" | "signal" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  brand:
    "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/35",
  signal:
    "bg-gradient-to-br from-signal-500 to-signal-600 text-white shadow-lg shadow-signal-500/25 hover:shadow-xl hover:shadow-signal-500/35",
  outline:
    "border border-black/10 bg-white text-foreground shadow-sm hover:shadow-md hover:border-black/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs gap-1.5",
  md: "px-6 py-3 text-sm gap-2",
  lg: "px-8 py-4 text-base gap-2",
};

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ElementType;
  iconPosition?: "left" | "right";
  className?: string;
  children: ReactNode;
}

type ButtonProps<T extends ElementType> = ButtonOwnProps & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof ButtonOwnProps | "as">;

/**
 * Botón de marca — pill, gradiente, glow de sombra a color, y un "barrido" de
 * brillo diagonal al pasar el mouse. Polimórfico: `as={Link}` para rutas
 * internas, por defecto renderiza <a>. Pensado para reemplazar los CTAs
 * planos del navbar y los heroes en las 3 páginas del proyecto.
 */
function ButtonInner<T extends ElementType = "a">(
  {
    as,
    variant = "brand",
    size = "md",
    icon: Icon,
    iconPosition = "right",
    className,
    children,
    ...rest
  }: ButtonProps<T>,
  ref: React.Ref<HTMLElement>
) {
  const Component = motion.create ? motion.create(as || "a") : motion(as || "a");

  return (
    <Component
      ref={ref}
      whileHover={{ scale: 1.045, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full font-bold whitespace-nowrap",
        "transition-shadow duration-300",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {/* Barrido de brillo diagonal, solo en variantes con gradiente */}
      {variant !== "outline" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
      )}
      {Icon && iconPosition === "left" && (
        <Icon className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
      )}
      <span className="relative">{children}</span>
      {Icon && iconPosition === "right" && (
        <Icon className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </Component>
  );
}

export const Button = forwardRef(ButtonInner) as <T extends ElementType = "a">(
  props: ButtonProps<T> & { ref?: React.Ref<HTMLElement> }
) => JSX.Element;
