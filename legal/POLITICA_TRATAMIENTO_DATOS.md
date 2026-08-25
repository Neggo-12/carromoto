# Política de Tratamiento de Datos y Aviso de Privacidad — Tallergo

**Versión:** 1.0 · **Vigente desde:** 25 de agosto de 2026

Esta política se rige por la Ley 1581 de 2012, su decreto reglamentario (Decreto 1074 de 2015) y los criterios de la Superintendencia de Industria y Comercio (SIC), autoridad de vigilancia en materia de protección de datos personales en Colombia.

## 1. Responsable del Tratamiento

[PENDIENTE — razón social, NIT y domicilio de la sociedad que opera Tallergo]. Canal de contacto para ejercer sus derechos: [PENDIENTE — correo o formulario oficial]. Hasta que este dato se complete, esta Política opera como borrador funcional; ver `legal/README.md`.

## 2. Qué datos recolectamos

Según el tipo de cuenta, recolectamos:

- **Clientes:** nombre, correo electrónico, celular/WhatsApp, ciudad, tipo de vehículo (carro, moto o ambos) y su motorización (eléctrico, híbrido o combustión). Opcionalmente, tipo y número de documento cuando se requiere para generar un comprobante.
- **Talleres/almacenes:** nombre del encargado, correo, celular, nombre del negocio, tipo de negocio, ciudad, dirección, barrio, descripción del negocio, y los datos de geolocalización (latitud/longitud) que resultan de geocodificar esa dirección.
- **Datos de uso:** solicitudes de contacto entre cliente y taller, reservas de campañas, comprobantes generados por el taller, y eventos básicos de uso de la plataforma.

No recolectamos datos biométricos, de salud, ni categorías sensibles. No recolectamos datos de menores de edad — el registro está dirigido a personas mayores de edad.

## 3. Para qué usamos sus datos (finalidad)

- Crear y administrar su cuenta, y verificar la identidad del taller antes de otorgarle el Sello de Confianza.
- Mostrarle talleres relevantes según su ciudad y tipo de vehículo, y mostrarle al taller las solicitudes de contacto y reservas de campaña que le correspondan.
- Generar el código de verificación que confirma que un contacto proviene realmente del taller correspondiente.
- Calcular y comunicar puntos o beneficios de campañas (bienvenida, multiplicadores), cuando esas campañas estén activas.
- Comunicarnos con usted por correo o WhatsApp sobre el estado de su cuenta, sus solicitudes o cambios relevantes del servicio.
- Cumplir obligaciones legales y atender requerimientos de autoridades competentes.

No usamos sus datos para finalidades de marketing de terceros ni los vendemos.

## 4. Base jurídica y autorización

El tratamiento de sus datos se realiza con base en la autorización que usted otorga expresamente al marcar la casilla de tratamiento de datos en el formulario de registro — separada de la aceptación de los Términos y Condiciones, conforme lo exige la ley. Guardamos evidencia de esa autorización: quién la dio, cuándo, y con qué versión de esta Política, en un registro que no se modifica ni se borra.

## 5. Con quién compartimos sus datos

- **Entre cliente y taller:** cuando usted contacta a un taller o reserva una campaña, el taller recibe los datos necesarios para atenderlo (nombre, teléfono/WhatsApp, y el detalle de lo que necesita).
- **Proveedores de infraestructura:** la plataforma corre sobre Supabase (base de datos y autenticación) y se despliega en un proveedor de hosting. Estos proveedores procesan los datos por cuenta nuestra, no para fines propios.
- No compartimos sus datos con terceros para fines publicitarios.

Cuando la integración con el sistema de puntos de Grupo Neggo esté activa, esta política se actualizará para reflejar exactamente qué datos se envían a ese sistema y con qué finalidad — hoy esa integración no está conectada y no se envía ningún dato a ese sistema.

## 6. Dónde se almacenan sus datos

Sus datos se almacenan en la infraestructura de Supabase. [PENDIENTE — confirmar la región/país de alojamiento del proyecto de Supabase usado en producción, para completar si corresponde una transferencia internacional de datos conforme a la sección 10 del documento de gobernanza].

## 7. Cuánto tiempo conservamos sus datos

Conservamos sus datos mientras su cuenta esté activa y por el tiempo adicional necesario para cumplir obligaciones legales, contables o de defensa ante reclamos. Si solicita la eliminación de su cuenta, eliminamos o anonimizamos los datos que ya no sean necesarios para esos fines, conforme a la solicitud que nos haga llegar por el canal de contacto indicado en la sección 1.

## 8. Sus derechos (Hábeas Data)

Como titular de sus datos personales, usted tiene derecho a:

- Conocer, actualizar y rectificar sus datos.
- Solicitar prueba de la autorización que otorgó.
- Ser informado sobre el uso que le hemos dado a sus datos.
- Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.
- Revocar la autorización y/o solicitar la supresión de sus datos, cuando no exista un deber legal o contractual que impida eliminarlos.
- Acceder gratuitamente a sus datos.

Para ejercer cualquiera de estos derechos, escriba a [PENDIENTE — canal de contacto]. Hoy la plataforma no tiene un módulo dedicado de solicitudes (Privacy Center); la solicitud se atiende manualmente por ese canal mientras ese módulo no exista — ver `legal/README.md`.

## 9. Seguridad

Aplicamos controles razonables para proteger sus datos: acceso restringido por rol dentro de la plataforma (Row Level Security en la base de datos, para que cada cuenta solo pueda ver la información que le corresponde), contraseñas gestionadas por el proveedor de autenticación (nunca las vemos en texto plano), y separación entre el proyecto de Tallergo y otros proyectos del mismo grupo (Neggo, Puntos Neggo).

## 10. Menores de edad

Este servicio está dirigido a personas mayores de edad. Si detectamos una cuenta registrada por un menor, la desactivaremos.

## 11. Cambios a esta Política

Podemos actualizar esta Política cuando cambien las condiciones del tratamiento. La versión vigente siempre está publicada en `/legal/privacidad`, con su fecha de vigencia.

---

*Este documento es un borrador funcional preparado para habilitar el flujo de registro con consentimiento explícito conforme a la Ley 1581 de 2012. Antes de considerarlo definitivo, debe completarse la sección 1 y pasar por revisión de un abogado — ver `legal/README.md`.*
