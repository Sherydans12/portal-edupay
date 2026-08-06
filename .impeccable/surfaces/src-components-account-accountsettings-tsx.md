---
version: 1
slug: "src-components-account-accountsettings-tsx"
primary_target: "src/components/account/AccountSettings.tsx"
related_targets: ["src/components/PortalApp.tsx","src/app/verify-email/VerifyEmailForm.tsx"]
---

# Mi cuenta

- Alcance y modo: extensión Operate para apoderados autenticados; el panel administrador queda fuera.
- Trabajo: comprender qué información personal conserva el colegio y actualizar de forma segura el correo o la contraseña.
- Contenido y prueba: nombre, RUT y correo vigentes desde EduPay; estado de sincronización; confirmación por correo; contraseña exclusivamente local.
- Dirección: hereda el sistema institucional del portal. La identidad personal ocupa la superficie blanca y la seguridad se concentra en un panel azul, sin iconografía familiar ni adornos infantiles.
- Momento memorable: el estado “Sincronizado” hace visible la relación con EduPay y el cambio de correo mantiene la dirección anterior hasta verificar la nueva.
- Restricciones: RUT y nombre no editables; actualización EduPay antes de la copia local; webhook idempotente; móvil primero; estados loading, cached, pending, success, error y conflict.

## Decisiones durables de la superficie

- Jerarquía: “Información personal” es la tarea primaria. “Seguridad de la cuenta” es una tarea independiente y secundaria; en escritorio acompaña a la derecha y en móvil aparece después de los datos personales. No convertir esta pantalla en un dashboard ni sumar navegación propia.
- Autoridad de datos: nombre y RUT se leen como identidad institucional, no como campos deshabilitados. El estado de origen debe distinguir “Sincronizado” de “Última copia” en texto además de color.
- Cambio de correo: la dirección vigente nunca se reemplaza de forma optimista. Una solicitud pendiente se muestra como un estado separado, nombra el correo nuevo y explica que el anterior sigue activo hasta confirmar.
- Degradación: si EduPay no responde, se conserva la última copia para lectura y se bloquea sólo el cambio de correo. El cambio de contraseña continúa disponible porque pertenece al Portal.
- Acciones: cada bloque tiene una sola acción principal y la habilita sólo cuando sus requisitos están completos. Carga, bloqueo y progreso se expresan en el propio control; los avisos transitorios complementan, pero no sustituyen, el estado visible.
- Verificación fuera de sesión: `VerifyEmailForm` es la continuación del cambio de correo, no una identidad visual nueva. Usa el logo, la tarjeta institucional y un único resultado central; conserva la misma composición para confirmar, cargar, éxito, error y enlace inválido.
- Recuperación: éxito devuelve a “Mi cuenta”; error o enlace inválido ofrece volver al portal. El mensaje de error debe confirmar que el correo anterior sigue vigente y nunca insinuar pérdida de acceso.
- Accesibilidad y adaptación: estado, icono y texto siempre viajan juntos; los cambios asíncronos se anuncian; los objetivos táctiles conservan altura cómoda. En móvil la lectura permanece lineal, sin columnas internas ni acciones flotantes.

## Límite con el sistema global

Esta superficie reutiliza tipografía, colores, radios, sombras, iconografía y tono definidos en `DESIGN.md`. El panel azul de seguridad, el indicador de sincronización y la tarjeta de verificación son expresiones locales de esos recursos, no nuevos tokens ni patrones globales.
