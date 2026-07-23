# Contratos Esperados EduPay

Este documento define un borrador inicial de los endpoints que el Portal de Pagos Institucional espera consumir desde EduPay. Los nombres, campos y codigos finales deben validarse con el equipo proveedor.

## Autenticacion

Todas las llamadas desde el BFF hacia EduPay usaran token servidor a servidor.

```http
Authorization: Bearer ${EDUPAY_API_TOKEN}
Content-Type: application/json
```

## GET /api/v1/students/:rut/debts

Obtiene alumnos vinculados a un apoderado y sus deudas vigentes.

Parametros:

- `rut`: RUT del apoderado autenticado, normalizado sin puntos y con guion.

Respuesta esperada:

```json
{
  "guardian": {
    "rut": "11111111-1",
    "name": "Nombre Apoderado"
  },
  "students": [
    {
      "id": "stu_001",
      "rut": "22222222-2",
      "name": "Nombre Alumno",
      "course": "4 Basico A",
      "accountNumber": "CC-2026-001",
      "installments": [
        {
          "id": "ins_001",
          "month": "Marzo",
          "dueDate": "2026-03-10",
          "amount": 95000,
          "currency": "CLP",
          "status": "VENCIDO"
        }
      ]
    }
  ]
}
```

Estados soportados:

- `PAGADO`
- `VENCIDO`
- `POR_VENCER`

## POST /api/v1/payments/sync

Sincroniza en EduPay un pago aprobado y validado previamente por Webpay.

Request:

```json
{
  "buyOrder": "OC-12345678",
  "amount": 190000,
  "paymentMethod": "WEBPAY",
  "authorizationCode": "AUTH-123456",
  "cardNumber": "6623",
  "chargeIds": [101, 102]
}
```

Respuesta exitosa:

```json
{
  "status": "SYNCED",
  "edupayPaymentId": "edp_pay_001",
  "syncedAt": "2026-06-23T15:30:05.000Z"
}
```

Respuesta idempotente:

```json
{
  "status": "ALREADY_SYNCED",
  "edupayPaymentId": "edp_pay_001",
  "syncedAt": "2026-06-23T15:30:05.000Z"
}
```

## Requisitos Transversales

- `portalPaymentId` debe ser idempotente.
- EduPay debe rechazar pagos duplicados para las mismas cuotas si ya fueron saldadas.
- Los errores transitorios deben responder con `408`, `429` o `5xx` para activar reintentos.
- Los errores permanentes deben responder con `4xx` y un codigo funcional claro.
- Todas las fechas se intercambian en ISO 8601 UTC.
