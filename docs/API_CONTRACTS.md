# Contratos del Portal con BL-002

El BFF del portal consume `EDUPAY_API_URL` desde el servidor. Envía `Authorization: Bearer <EDUPAY_API_TOKEN>` y `x-tenant-id` del colegio. El navegador opera contra el portal con su sesión de apoderado.

## Estado de cuenta

`GET /api/v1/portal/guardian/{rut}` valida el apoderado del tenant. `GET /api/v1/portal/guardian/{rut}/statement` devuelve el apoderado y sus alumnos con los cargos vigentes. La respuesta de BL usa el sobre `{ data: ... }`.

| Campo de cada cuota | Uso |
|---|---|
| `id` | ID numérico del cargo en BL-002. |
| `academicYear.id`, `academicYear.label` | Año de la matrícula asociada al cargo. El selector del portal usa este ID. |
| `enrollmentCourse` | Nombre del curso correspondiente a esa matrícula. |
| `dueDate`, `month` | Vencimiento calendario ISO y mes de presentación. Una matrícula 2027 puede vencer en 2026. |
| `concept.name` | Nombre que configuró el colegio, por ejemplo «Matrícula». |
| `amount`, `paidAmount`, `outstandingAmount` | Importes en CLP y saldo calculado por BL. |
| `status` | `PAGADO`, `VENCIDO` o `PENDIENTE`. La vista actual muestra `PENDIENTE` como cuota por vencer. |

El selector muestra los años presentes en los cargos del apoderado. Las cuotas sin datos de año, procedentes de una versión anterior de BL BACK, permanecen visibles en **Todos los años**. El año de los cargos se toma de la matrícula; el vencimiento permanece como dato independiente.

BL-002 administra el concepto, monto, vencimiento y emisión de cargos. Al seleccionar **Emitir matrícula por año** en BL quedan disponibles los cargos de alumnos con apoderado y matrícula vigente para ese año. El portal muestra lo emitido, incluso si el año sigue en borrador académico. Para la operación del colegio, consulta [Matrícula 2027 y portal en BL-002](https://github.com/Sherydans12/BL-002-EduPay/blob/main/docs/operations/MATRICULA-2027-PORTAL.md).

## Inicio y confirmación del pago

1. `POST /api/webpay/init` recibe los identificadores seleccionados y el total visto en pantalla. Vuelve a consultar el estado de cuenta del apoderado autenticado. Si los cargos o el saldo cambiaron, responde `409` antes de iniciar Webpay. El comprobante se arma con los conceptos e importes que devuelve BL.
2. Tras confirmar un pago en Webpay, el portal envía `POST /api/v1/portal/payments/sync` a BL. Envía `buyOrder`, `amount`, `paymentMethod: "WEBPAY"`, los `chargeIds` y los datos opcionales de confirmación. BL valida el monto contra el saldo y aplica la orden de forma idempotente por tenant y orden.
3. La respuesta incluye `synced`, `alreadyProcessed`, `buyOrder`, `paymentGroupId`, `amount` y `chargeIds`. El portal conserva los intentos fallidos para reintento.
