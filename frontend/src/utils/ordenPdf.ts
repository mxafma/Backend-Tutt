// Generación de la Orden de Compra en PDF (100% en el navegador, sin backend).
// Se usa desde la tabla de Órdenes y desde el detalle de la orden.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrdenCompra, EstadoOrden, EstadoProductoOrden, TipoCompra } from '../types';

const ESTADO_LABEL: Record<EstadoOrden, string> = {
  BORRADOR: 'Borrador',
  LISTA_PARA_COMPRAR: 'Lista para Comprar',
  EN_COMPRA: 'En Compra',
  COMPRADA: 'Comprada',
  RECIBIDA: 'Recibida',
  CERRADA: 'Cerrada',
  CANCELADA: 'Cancelada',
};

const ESTADO_PRODUCTO_LABEL: Record<EstadoProductoOrden, string> = {
  PENDIENTE: 'Pendiente',
  COMPRADO: 'Comprado',
  COMPRA_PARCIAL: 'Compra Parcial',
  NO_COMPRADO: 'No Comprado',
  AGREGADO_EN_MERCADO: 'Agregado en Mercado',
};

const TIPO_LABEL: Record<TipoCompra, string> = {
  MERCADO: 'Mercado',
  PROVEEDOR_LOCAL: 'Proveedor Local',
  INSUMO: 'Insumo',
  GASTO_OPERATIVO: 'Gasto Operativo',
};

// Verde de la marca (mismo tono que los botones "Nueva Orden").
const VERDE: [number, number, number] = [22, 163, 74];

const clp = (n?: number | null): string =>
  n != null ? `$${Math.round(n).toLocaleString('es-CL')}` : '—';

const num = (n?: number | null): string =>
  n != null ? n.toLocaleString('es-CL') : '—';

const fecha = (f?: string | null): string => {
  if (!f) return '—';
  const d = new Date(f);
  if (isNaN(d.getTime())) return f; // fechas guardadas como texto plano (ej: "2026-07-22")
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Genera y descarga el PDF de una orden. Devuelve el nombre del archivo. */
export function descargarOrdenPdf(orden: OrdenCompra): string {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();

  // ---- Encabezado ----
  doc.setFillColor(...VERDE);
  doc.rect(0, 0, pageWidth, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Orden de Compra', margin, 34);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`N.° ${orden.id ?? '—'}`, margin, 52);
  doc.text(
    `Estado: ${ESTADO_LABEL[orden.estado] ?? orden.estado}`,
    pageWidth - margin,
    52,
    { align: 'right' },
  );

  // ---- Bloque de información general ----
  const proveedorLugar = orden.proveedorNombre || orden.lugarCompra || '—';
  const info: [string, string][] = [
    ['Fecha planificada', fecha(orden.fechaCompraPlanificada)],
    ['Tipo de compra', TIPO_LABEL[orden.tipoCompra] ?? orden.tipoCompra],
    ['Proveedor / Lugar', proveedorLugar],
    ['Encargado', orden.encargadoCompra || '—'],
    ['Fecha de creación', fecha(orden.fechaCreacion)],
    ['Fecha compra real', fecha(orden.fechaCompraReal)],
  ];

  let y = 92;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  const colW = (pageWidth - margin * 2) / 3;
  info.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * colW;
    const yy = y + row * 34;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text(item[0].toUpperCase(), x, yy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(item[1], x, yy + 14);
  });
  y += 34 * Math.ceil(info.length / 3) + 6;

  if (orden.observaciones) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text('OBSERVACIONES', margin, y);
    doc.setTextColor(40, 40, 40);
    const lineas = doc.splitTextToSize(orden.observaciones, pageWidth - margin * 2);
    doc.text(lineas, margin, y + 14);
    y += 14 + lineas.length * 12 + 8;
  }

  // ---- Tabla de productos ----
  const detalles = orden.detalles ?? [];
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Producto', 'Formato', 'Solic.', 'Comp.', 'Costo', 'Fact.', 'Estado']],
    body: detalles.map(d => [
      (d.nombreProductoSnapshot || d.producto?.nombre || '—') +
        (d.agregadoEnMercado ? '  (mercado)' : ''),
      d.formato || '—',
      num(d.cantidadSolicitada),
      d.cantidadComprada != null ? num(d.cantidadComprada) : '—',
      clp(d.costoTotal),
      d.factura === true ? 'Sí' : d.factura === false ? 'No' : '—',
      d.estadoProducto ? ESTADO_PRODUCTO_LABEL[d.estadoProducto] ?? d.estadoProducto : 'Pendiente',
    ]),
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: VERDE, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 245] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'center' },
      6: { halign: 'center' },
    },
  });

  // Total comprado
  const totalComprado = detalles.reduce((s, d) => s + (d.costoTotal ?? 0), 0);
  // @ts-expect-error - lastAutoTable lo agrega el plugin en runtime
  let afterTableY = doc.lastAutoTable.finalY + 16;
  if (totalComprado > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total comprado: ${clp(totalComprado)}`, pageWidth - margin, afterTableY, {
      align: 'right',
    });
    afterTableY += 20;
  }

  // ---- Precios calculados (solo si la orden ya tiene precios) ----
  const hayPrecios = detalles.some(
    d => d.costoUnitarioCalculado != null || d.precioSugerido != null,
  );
  if (hayPrecios) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text('Precios calculados', margin, afterTableY);
    autoTable(doc, {
      startY: afterTableY + 8,
      margin: { left: margin, right: margin },
      head: [['Producto', 'Formato', 'Costo/U', 'Sugerido', 'Final', 'Margen']],
      body: detalles.map(d => [
        d.nombreProductoSnapshot || d.producto?.nombre || '—',
        d.formato || '—',
        clp(d.costoUnitarioCalculado),
        clp(d.precioSugerido),
        d.precioFinalEditado ? clp(d.precioFinalEditado) : '—',
        d.margenResultante != null ? `${d.margenResultante.toFixed(1)}%` : '—',
      ]),
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: VERDE, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 245] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center' },
      },
    });
  }

  // ---- Pie de página ----
  const totalPaginas = doc.getNumberOfPages();
  const generado = new Date().toLocaleString('es-CL');
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generado el ${generado}`,
      margin,
      doc.internal.pageSize.getHeight() - 20,
    );
    doc.text(
      `Página ${i} de ${totalPaginas}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'right' },
    );
  }

  const nombre = `orden-compra-${orden.id ?? 'sin-id'}.pdf`;
  doc.save(nombre);
  return nombre;
}
