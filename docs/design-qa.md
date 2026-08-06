# QA visual — flujo del apoderado

**Estado: aprobado** · 30 de julio de 2026

## Referencia y comparación

- Referencia elegida: `docs/guardian-design-reference-option-3.png`
- Implementación comparada: `docs/guardian-redesign-desktop-selected.png`
- Comparación lado a lado: `docs/design-comparison-desktop.png`
- Vista móvil: `docs/guardian-redesign-mobile.png`

## Resultado

- **Jerarquía y orden:** aprobado. El flujo conserva la secuencia solicitada: situación, revisión por estudiante y pago seguro; luego el resumen, estudiantes y la acción de pago fija.
- **Estilo y color:** aprobado. Se usa azul institucional, acento amarillo cálido, superficies blancas y bordes suaves. El logo real se muestra desde el activo institucional provisto.
- **Iconos y ornamento:** aprobado. Se reemplazaron los recursos familiares por iconos de línea pequeños y consistentes; el logo institucional es la única ilustración visible.
- **Tipografía y legibilidad:** aprobado. Nunito Sans ordena títulos, montos y datos con pesos diferenciados y mantiene la lectura compacta.
- **Responsive:** aprobado en 1440 × 1024 y 390 × 844. En móvil, el proceso se apila, cada cuota muestra sus datos en dos columnas y la barra de pago queda sobre la navegación inferior.
- **Interacciones principales:** aprobado. La selección de cuotas actualiza el conteo y total; Estado de cuenta, Historial de pagos y Certificados navegan correctamente.

## Diferencias intencionales respecto de la referencia

- Los vencimientos provienen de los datos demo actuales (marzo–mayo), no de la fecha ilustrativa del concepto.
- La implementación usa el logo real entregado y no el emblema genérico de la referencia.
- Se omitió la ilustración familiar del resumen según la indicación de diseño.

## Historial, certificados y documentos

**Estado: aprobado**

- Historial revisado en escritorio y móvil con selector de estudiante, resumen de pagos, listado de comprobantes y estado vacío coherente.
- Certificados revisados en escritorio y móvil con disponibilidad por estudiante, estados desactivados explicados y generación con indicador de carga.
- Comprobante modal revisado en escritorio y móvil; incorpora encabezado institucional, referencia de compra, estado de autorización, detalle y acciones de impresión/descarga.
- El diálogo bloquea el desplazamiento de la página de fondo y conserva cierre por botón, fondo y tecla Escape.
- Certificado y comprobante PDF renderizados en A4 con logo oficial, azul/amarillo institucional, metadatos, identificador, paginación y contenido legible.
- La descarga real fue ejecutada desde el portal y los archivos finales fueron reabiertos con Poppler: una página A4, sin recortes, solapamientos ni texto ilegible.

### Evidencia

- `docs/guardian-documents-final-review.png`
- `docs/receipt-mobile-final.png`
- `docs/pdf-final-review.png`
- `output/pdf/certificado_alumno_regular_martina_fuentes.pdf`
- `output/pdf/comprobante_pago_oc_26030701.pdf`
