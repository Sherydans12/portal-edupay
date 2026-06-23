# Portal de Pagos Institucional - Arquitectura

## Patron BFF

El portal operara como un Backend for Frontend (BFF) dentro de Next.js. La interfaz no consumira directamente EduPay ni Transbank; toda operacion sensible pasara por Server Actions o Route Handlers del portal.

Responsabilidades del BFF:

- Validar autenticacion y autorizacion de apoderados.
- Normalizar respuestas de EduPay para la experiencia del portal.
- Crear y confirmar transacciones Webpay.
- Persistir auditoria transaccional propia en PostgreSQL.
- Usar Redis para sesiones, cache de lecturas a EduPay y cola de reintentos.

## Separacion de Autenticacion y Datos Financieros

La autenticacion vive aislada en la base de datos del Portal. El Portal DB mantiene usuarios, sesiones, permisos, auditoria local, intentos de pago y correlaciones internas.

EduPay sigue siendo la fuente de verdad financiera. El portal no calcula deuda institucional de forma independiente; solicita saldos, cuotas y estados a EduPay usando el RUT o identificador autorizado del apoderado/alumno. Las respuestas pueden cachearse brevemente en Redis para reducir latencia, pero siempre con TTL bajo y revalidacion posterior a un pago.

Flujo esperado:

1. El apoderado inicia sesion contra el Portal DB.
2. El BFF valida la sesion y obtiene alumnos vinculados desde el Portal DB o desde EduPay, segun contrato final.
3. Para estado de cuenta, el BFF consulta EduPay y entrega al frontend un DTO estable.
4. Para pagos, el BFF crea una intencion local, inicia Webpay y registra trazabilidad en PostgreSQL.
5. Luego de confirmacion Webpay, el BFF sincroniza el pago hacia EduPay.

## Ciclo de Vida Webpay y Resiliencia

1. El apoderado selecciona cuotas y solicita pagar.
2. El BFF crea una orden local en PostgreSQL con estado `PENDING`.
3. El BFF llama a Webpay en ambiente de integracion y retorna la URL/token de redireccion.
4. Webpay retorna al portal o notifica la confirmacion.
5. El BFF valida la transaccion contra Transbank antes de considerarla aprobada.
6. Si la transaccion fue aprobada, el BFF marca la orden local como `APPROVED_PENDING_SYNC`.
7. El BFF llama `POST /api/v1/payments/sync` en EduPay para registrar el pago institucional.
8. Si EduPay confirma, la orden queda `SYNCED` y se invalida el cache Redis del alumno.

Estrategia de resiliencia:

- Si EduPay esta caido o responde con error transitorio, el pago aprobado no se pierde.
- El BFF guarda el payload de sincronizacion en PostgreSQL y encola una referencia en Redis.
- Un cronjob o worker periodico procesa reintentos con backoff controlado.
- Cada intento registra respuesta, timestamps y contador de reintentos.
- Al superar el limite configurado, la orden pasa a `SYNC_FAILED` y queda disponible para revision operacional.
- Las consultas de deuda deben mostrar un estado conservador cuando exista un pago aprobado pendiente de sincronizacion, evitando que el apoderado pague dos veces las mismas cuotas.

## Componentes Locales

- PostgreSQL 16: persistencia transaccional del portal.
- Redis: sesiones, cache de EduPay y cola liviana de reintentos.
- Next.js BFF: Server Actions y Route Handlers para integrar EduPay y Webpay.
