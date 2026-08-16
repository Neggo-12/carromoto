# CarroMoto (nombre temporal)

Marketplace de talleres y repuestos de carro/moto verificados — producto nuevo y separado de Neggo, mismo modelo de negocio aplicado a un solo vertical. Ver brief completo del proyecto para contexto de negocio.

## Estado actual

Solo existe la landing page (Hub con dos perfiles: Cliente / Taller-Repuesto). No hay backend, Supabase, auth ni base de datos todavía — eso se construye en las siguientes etapas, siguiendo el orden recomendado del brief:

1. ~~Landing page~~ ✅ (esta entrega)
2. Modelo de datos base (organizations/users/memberships + auth + RLS)
3. Registro B2B (talleres/repuestos) y B2C (clientes)
4. Admin Dashboard mínimo
5. Verificación / Sello de Confianza
6. CRM Ventas
7. Búsqueda/matching cliente↔taller
8. Facturación/tarifas
9. WhatsApp bot

## Correr el proyecto localmente

```bash
npm install
npm run dev
```

Abre en `http://localhost:8080`.

Para generar el build de producción:

```bash
npm run build
npm run preview
```

## Stack

React + TypeScript + Vite + Tailwind CSS + react-router-dom + lucide-react. Mismo lenguaje visual y patrones de neggo-12 (tokens de Tailwind vía variables CSS HSL, `cn()` utility), pero con paleta de marca propia (azul + naranja) en vez del verde/ámbar de Neggo.

## Nombre

"CarroMoto" es un placeholder — nombre real por definir. Aparece marcado como "nombre temporal" en el header y footer de la landing para que sea obvio que no es la marca final.
