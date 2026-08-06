# Sincronización del correo del apoderado

EduPay es la fuente oficial del correo del apoderado. El Portal conserva una
copia local para autenticación, recuperación y envío de comprobantes.

## Flujo iniciado desde el Portal

1. `Mi cuenta` consulta el perfil vigente en EduPay.
2. El apoderado ingresa el correo nuevo y confirma su contraseña actual.
3. El Portal envía un enlace con vigencia de 60 minutos al correo nuevo.
4. Al confirmar, el Portal vuelve a consultar EduPay y envía el `PATCH` con
   `expectedUpdatedAt`.
5. EduPay se actualiza primero. Solo después se actualiza la copia local.
6. Un conflicto `409` cancela la solicitud y obliga a comenzar nuevamente.

## Flujo iniciado desde EduPay

EduPay publica `guardian.email.updated` en:

```text
POST /api/webhooks/edupay/guardian-email
```

El Portal valida la firma HMAC usando el cuerpo crudo, exige un timestamp dentro
de cinco minutos y deduplica por `eventId`. Los eventos atrasados no sobrescriben
una versión más reciente.

Variables requeridas:

```dotenv
# Cada despliegue del Portal sirve un único tenant.
NEXT_PUBLIC_TENANT_ID="<tenant-de-este-despliegue>"
EDUPAY_API_TOKEN="<key-del-mismo-tenant-en-PORTAL_TENANT_KEYS>"
EDUPAY_USE_DEMO_DATA=false
# Valor plano: no pegar aquí el JSON completo de GUARDIAN_EMAIL_WEBHOOKS.
EDUPAY_GUARDIAN_EMAIL_WEBHOOK_SECRET="<mismo-secret-configurado-en-edupay>"
```

En una instalación multi-tenant puede utilizarse
`EDUPAY_GUARDIAN_EMAIL_WEBHOOK_SECRETS` como mapa JSON.

Si existen dos despliegues —por ejemplo producción y demostración— EduPay debe
tener una entrada en `GUARDIAN_EMAIL_WEBHOOKS` por tenant, cada una apuntando al
dominio correspondiente. Se recomienda usar un secreto HMAC distinto para cada
tenant.

## Contraseñas

Las contraseñas permanecen únicamente en el Portal. Nunca se incluyen en
consultas, actualizaciones ni eventos de EduPay.

## Desarrollo local

Con `EDUPAY_USE_DEMO_DATA=true`, el Portal simula la escritura S2S. Si Resend no
está configurado, la respuesta de desarrollo muestra un enlace local para
completar la verificación sin enviar un correo real.
