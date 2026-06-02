# Contexto para IA - Sistema Digital de Compras para Verdulería

## 1. Descripción general del proyecto

Se necesita diseñar y desarrollar un sistema digital para una verdulería dedicada a la venta minorista y mayorista de productos agrícolas y relacionados.

Actualmente el negocio funciona con un flujo híbrido:
- Una aplicación básica en Python para crear órdenes de compra.
- Órdenes impresas en papel.
- Registro manual durante la compra en el mercado.
- Traspaso posterior a planillas Excel.
- Cálculo manual o semimanual de precios de venta.

El objetivo principal es reemplazar progresivamente este flujo por un sistema digital centralizado que permita crear órdenes, registrar compras reales, recibir mercadería, calcular precios sugeridos, consultar historial y generar reportes básicos.

---

## 2. Problema principal

El problema no es solamente el uso de papel, sino la falta de centralización, trazabilidad y automatización.

Actualmente la misma información pasa por varias etapas desconectadas:
1. Aplicación básica.
2. Documento impreso.
3. Anotaciones manuales.
4. Excel.
5. Revisión administrativa posterior.

Esto genera:
- Doble digitación.
- Riesgo de pérdida de información.
- Errores en costos, cantidades y precios.
- Dificultad para modificar datos después de imprimir.
- Falta de métricas confiables.
- Poco control sobre productos no comprados o comprados parcialmente.
- Dependencia de impresora.
- Falta de edición remota.
- Falta de historial claro.

---

## 3. Objetivo del sistema

Crear un sistema digital que permita:

- Crear órdenes de compra.
- Editar órdenes antes de comprar.
- Visualizar una orden activa desde Android, tablet o PC.
- Completar la compra real desde un dispositivo digital.
- Registrar cantidades compradas, costos, factura sí/no y comentarios.
- Identificar productos no comprados, comprados parcialmente o agregados en el mercado.
- Registrar recepción de mercadería.
- Calcular precios sugeridos según margen.
- Exportar información operativa a Excel.
- Mantener historial básico.
- Generar reportes administrativos simples.
- Funcionar offline para el comprador cuando esté en el mercado.
- Sincronizar datos automáticamente cuando vuelva internet.

---

## 4. Usuarios y roles

### Administrador
Tiene acceso completo al sistema.

Permisos:
- Gestionar órdenes.
- Gestionar compras.
- Gestionar recepción.
- Ver métricas y reportes.
- Ver historial.
- Gestionar usuarios.
- Gestionar productos.
- Gestionar proveedores.
- Corregir información.
- Eliminar, anular o inactivar registros.
- Acceder a historial sensible.

### Comprador
Usa el sistema principalmente en el mercado.

Permisos:
- Ver la orden activa.
- Iniciar modo compra.
- Completar cantidades compradas.
- Ingresar costos reales.
- Marcar si hubo factura.
- Agregar comentarios.
- Marcar productos como no comprados.
- Marcar compras parciales.
- Agregar productos encontrados en el mercado.
- Finalizar la compra.

La interfaz del comprador debe ser muy simple, con botones grandes y pocas opciones.

### Creador de orden de compra
Normalmente corresponde a la persona de cierre.

Permisos:
- Crear órdenes.
- Editar órdenes antes de la compra.
- Agregar productos solicitados.
- Definir cantidades solicitadas.
- Revisar pendientes del día.
- Dejar la orden lista para comprar.

### Persona de recepción o apertura
Recibe la mercadería y revisa la compra.

Permisos:
- Revisar cantidades.
- Corregir costos si corresponde.
- Completar cantidad interna de formatos.
- Calcular o revisar precios sugeridos.
- Cerrar la orden después de la recepción.

---

## 5. Flujo actual del negocio

1. La persona de cierre revisa productos faltantes.
2. Crea una orden inicial con producto, formato y cantidad solicitada.
3. La orden se imprime.
4. El comprador lleva el papel al mercado.
5. El comprador anota en el papel:
   - Cantidad comprada.
   - Costo real.
   - Si hubo factura.
   - Comentarios.
   - Productos no comprados.
   - Productos agregados.
6. La persona de apertura o recepción recibe la mercadería.
7. Traspasa la información a Excel.
8. Calcula precios de venta.
9. La administración revisa información de forma manual o parcial.

---

## 6. Flujo digital propuesto

1. Durante el día se registran pendientes de compra.
2. La persona de cierre revisa los pendientes.
3. Se crea una orden de compra digital.
4. La orden queda en estado Borrador.
5. La persona de cierre edita productos, formatos y cantidades.
6. Cuando la orden está lista, cambia a Lista para comprar.
7. El comprador visualiza la orden activa en Android, tablet o PC.
8. Al iniciar la compra, la orden cambia a En compra.
9. El comprador completa:
   - Cantidad comprada.
   - Costo real.
   - Factura sí/no.
   - Comentarios.
   - Estado del producto.
10. El comprador puede agregar productos nuevos encontrados en el mercado.
11. Al terminar, el comprador marca la orden como Comprada.
12. La persona de recepción revisa mercadería y datos ingresados.
13. Se completan o corrigen cantidades internas.
14. El sistema calcula precios sugeridos.
15. La persona de recepción cierra la orden.
16. La orden queda en historial.
17. La información queda disponible para reportes.

---

## 7. Estados de una orden de compra

Una orden puede tener los siguientes estados:

- Borrador: la orden está en preparación.
- Lista para comprar: la orden fue emitida y está lista para el comprador.
- En compra: el comprador está registrando la compra.
- Comprada: la compra fue realizada.
- Recibida: la mercadería fue recibida y revisada.
- Cerrada: la orden fue finalizada y queda en historial.
- Cancelada: la orden fue anulada.

---

## 8. Estados de un producto dentro de una orden

Cada producto dentro de una orden puede tener un estado propio:

- Pendiente: producto solicitado, pero todavía no comprado.
- Comprado: producto comprado según lo solicitado.
- Compra parcial: producto comprado en menor cantidad que la solicitada.
- No comprado: producto no comprado por falta de disponibilidad, precio u otra razón.
- Agregado en mercado: producto no estaba en la orden original, pero fue agregado por el comprador.

---

## 9. Datos principales de una orden

### Cabecera de orden

Campos sugeridos:
- id
- fecha
- creador_id
- comprador_asignado_id
- proveedor_o_lugar_id
- tipo_compra
- observaciones_generales
- estado
- fecha_creacion
- fecha_actualizacion
- fecha_cierre

### Detalle de orden

Campos sugeridos:
- id
- orden_id
- producto_id
- nombre_producto_snapshot
- formato
- cantidad_solicitada
- cantidad_comprada
- costo_total
- factura
- comentario
- estado_producto
- tipo_pago
- cantidad_interna
- costo_unitario_calculado
- precio_sugerido
- margen_sugerido
- precio_final_editado
- margen_resultante
- agregado_en_mercado
- usuario_ultima_modificacion
- fecha_ultima_modificacion

---

## 10. Productos, formatos y categorías

Los productos pueden tener:
- Código de barras.
- Nombre.
- Categoría opcional.
- Formatos habituales.
- Margen recomendado propio.
- Estado activo/inactivo.

Las categorías deben ser opcionales. El sistema no debe depender de categorías para funcionar.

Los formatos deben ser híbridos:
- Sugeridos por el sistema.
- Editables libremente por el usuario.

Ejemplos de formatos:
- Caja.
- Malla.
- Saco.
- Bandeja.
- Unidad.
- Kilo.
- Paquete.

---

## 11. Cantidad interna del formato

El sistema debe permitir registrar la cantidad interna de un formato comprado.

Ejemplo:
- Producto: Pimentón rojo.
- Formato comprado: Caja.
- Cantidad de formatos: 1.
- Costo total: 20.000.
- Cantidad interna: 40 unidades.
- Costo unitario: 500.

La cantidad interna puede:
- Ser ingresada por el comprador.
- Ser completada por recepción.
- Venir sugerida según el formato habitual.
- Ser corregida posteriormente por un usuario autorizado.

Este dato es importante para calcular el costo unitario real.

---

## 12. Proveedores y lugares de compra

El sistema debe soportar:
- Compras en mercado.
- Compras a proveedores externos que entregan en el local.
- Compras puntuales no planificadas.
- Compras de insumos y gastos operativos.

Datos sugeridos de proveedor:
- id
- nombre
- rut
- telefono
- direccion
- productos_habituales
- forma_pago_habitual
- activo

Tipos de compra:
- Mercado.
- Proveedor puntual.
- Insumo.
- Gasto operativo.

Ejemplos de gastos operativos:
- Bolsas.
- Envases.
- Cajas.
- Artículos de limpieza.
- Herramientas.
- Combustible.
- Otros gastos.

---

## 13. Formas de pago y estado de pago

Formas de pago:
- Efectivo.
- Transferencia.
- Tarjeta.
- Crédito.
- Pago posterior.

Estados de pago:
- Pagado.
- Pendiente.
- Parcialmente pagado.

---

## 14. Reglas de cálculo de precios

El sistema debe sugerir precios, no modificar directamente el POS en la primera versión.

El margen recomendado inicial puede ser 40%, pero debe ser modificable.

El margen no es fijo. Puede variar según:
- Producto.
- Precio de compra.
- Cantidad comprada.
- Calidad.
- Merma esperada.
- Disponibilidad.
- Estrategia comercial del día.

Productos con alta merma pueden requerir márgenes más altos, cercanos al 50%.

Si un producto está muy caro, se puede reducir el margen para no dejar un precio final demasiado alto.

Si un producto se compró muy barato y en gran cantidad, se puede vender más económico para mover volumen.

---

## 15. Fórmulas de precios y márgenes

El margen se calcula sobre el precio de venta, no sobre el costo.

Formula de margen:

Margen (%) = ((Precio de venta - Costo considerado) / Precio de venta) * 100

Formula de precio sugerido:

Precio sugerido = Costo considerado / (1 - Margen)

Formula de margen resultante:

Margen resultante (%) = ((Precio venta editado - Costo considerado) / Precio venta editado) * 100

Ejemplo:
- Costo considerado: 700.
- Precio de venta: 1.000.
- Margen: 30%.

---

## 16. Compra con factura y sin factura

Regla actual:

- Compra con factura:
  - Se usa el precio de compra registrado como base para calcular el precio de venta.

- Compra sin factura:
  - El precio comprado se multiplica por 1,19 para definir el costo considerado.

El tratamiento contable exacto de IVA, factura y compras sin factura queda pendiente de validación contable futura.

---

## 17. Redondeo de precios

Regla actual de redondeo:

Si el cálculo da 1.875, el precio queda en 1.870.

Interpretación:
- Redondeo hacia abajo a la decena más cercana.

Ejemplo:
- Precio calculado: 1.875.
- Precio sugerido final: 1.870.

---

## 18. Offline y sincronización

El comprador puede tener internet inestable o no confiable en el mercado.

La app debe funcionar offline para el comprador.

El comprador debe poder hacer offline:
- Ver la orden activa.
- Completar compras.
- Editar cantidades.
- Ingresar costos.
- Marcar factura sí/no.
- Agregar comentarios.
- Agregar productos nuevos.
- Cerrar la compra.

Cuando vuelva internet, la sincronización debe ser automática.

Estados visibles de sincronización:
- Guardado localmente.
- Pendiente de sincronización.
- Sincronizado.
- Error de sincronización.

Regla de conflicto inicial:
- Si dos personas editan el mismo dato, gana el último cambio en la primera versión.

---

## 19. Seguridad e historial

Reglas:
- Solo el administrador puede eliminar registros.
- Se recomienda priorizar anular, cancelar o inactivar antes que borrar definitivamente.
- Se desea guardar historial.
- En el MVP, el historial mínimo debe registrar:
  - Quién creó la orden.
  - Cuándo se creó la orden.
  - Quién cerró la orden.
  - Cuándo se cerró la orden.

Historial futuro:
- Cambios de cantidades.
- Cambios de costos.
- Productos agregados.
- Correcciones posteriores.
- Cambios de estado.
- Cambios de precios sugeridos o finales.

---

## 20. Exportación a Excel e integración con POS

El sistema debe exportar información operativa a Excel.

No se requiere mantener el formato actual del Excel.

Datos a exportar:
- Orden.
- Fecha.
- Producto.
- Formato.
- Cantidad solicitada.
- Cantidad comprada.
- Costo.
- Factura sí/no.
- Comentarios.
- Estado del producto.
- Precio sugerido.
- Margen sugerido.
- Precio final editado.
- Margen resultante.

El POS actual es Eleventa.

No se implementará integración automática con Eleventa en el MVP.

No se requiere comparar precio sugerido contra precio real vendido en la primera versión.

---

## 21. Reportes y métricas

En el MVP, los reportes serán tablas simples, sin gráficos.

Reportes diarios:
- Gasto total.
- Compras del día.
- Compras con factura.
- Compras sin factura.
- Pagos pendientes.

Reportes semanales o mensuales:
- Gasto acumulado.
- Evolución de precios.
- Productos más comprados.
- Proveedores más usados.
- Compras con factura.
- Compras sin factura.
- Pagos pendientes.
- Cantidad comprada por producto.
- Productos no comprados.

Filtros:
- Fecha.
- Producto.
- Categoría.
- Proveedor.
- Tipo de compra.
- Factura sí/no.
- Forma de pago.
- Usuario comprador.

Los reportes deben ser visibles solo para administrador.

No se requiere exportación de reportes en la primera versión.

---

## 22. Pantallas principales

### Login
Acceso al sistema por usuario y rol.

### Inicio
Accesos rápidos según rol.

### Orden activa
Muestra la orden vigente del día, especialmente para comprador.

### Crear orden
Permite crear cabecera y agregar productos solicitados.

### Modo compra
Vista simple para el comprador en el mercado.

### Recepción
Permite revisar mercadería, corregir cantidades o costos y calcular precios.

### Precios sugeridos
Muestra costo, margen, precio sugerido y margen resultante.

### Historial
Permite consultar órdenes anteriores.

### Productos
CRUD de productos.

### Proveedores
CRUD de proveedores.

### Reportes
Tablas administrativas básicas.

### Administración
Usuarios, roles y parámetros generales.

---

## 23. Principios de usabilidad

La aplicación debe estar pensada para usuarios con baja habilidad tecnológica.

Reglas de diseño:
- Vista del comprador muy simple.
- El comprador debería ver solo la orden activa.
- Evitar que el comprador edite órdenes antiguas por error.
- Botones grandes.
- Pocas opciones por pantalla.
- Flujo guiado.
- Alertas para acciones delicadas.
- Guardado automático.
- Mensajes claros de sincronización.
- Evitar pantallas sobrecargadas.

---

## 24. Alcance del MVP

La primera versión aceptable debe permitir:

- Crear órdenes de compra.
- Editar órdenes antes de comprar.
- Rellenar datos reales de compra.
- Registrar costos.
- Registrar cantidades.
- Registrar factura sí/no.
- Registrar comentarios.
- Marcar productos no comprados o comprados parcialmente.
- Agregar productos encontrados en mercado.
- Completar recepción.
- Calcular precios sugeridos.
- Editar precio sugerido y ver margen resultante.
- Exportar información operativa a Excel.
- Mantener historial básico.
- Usar modo offline para comprador.
- Sincronizar cuando vuelva internet.

---

## 25. Funcionalidades posteriores

No incluir en el MVP inicial, pero considerar para futuras versiones:

- Gráficos.
- Métricas avanzadas.
- Cálculo exacto de merma.
- Integración con POS Eleventa.
- Control de stock real.
- Reportes avanzados.
- Adjuntar documentos.
- Adjuntar fotos.
- Notificaciones avanzadas.
- Respaldos automáticos.
- Auditoría completa de cambios.
- Comparación entre precio sugerido y precio real vendido.

---

## 26. Arquitectura técnica esperada

Stack propuesto:

### Backend
- Spring Boot.
- API REST.
- Base de datos relacional.
- Autenticación por usuarios y roles.
- Endpoints para órdenes, productos, proveedores, usuarios, reportes y sincronización.

### Aplicación Android
- Kotlin.
- Funcionamiento offline.
- Almacenamiento local.
- Sincronización automática.
- Interfaz simple para comprador.

### Aplicación Web
- React o JavaScript.
- Uso administrativo.
- Creación y edición de órdenes.
- Productos.
- Proveedores.
- Reportes.
- Historial.

---

## 27. Entidades principales sugeridas

- Usuario.
- Rol.
- Producto.
- Categoría.
- FormatoProducto.
- Proveedor.
- OrdenCompra.
- DetalleOrdenCompra.
- CompraExterna.
- PagoCompra.
- PendienteCompra.
- HistorialOrden.
- SincronizacionPendiente.
- ParametroSistema.

---

## 28. Endpoints REST sugeridos

### Autenticación
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

### Usuarios
- GET /api/usuarios
- GET /api/usuarios/{id}
- POST /api/usuarios
- PUT /api/usuarios/{id}
- PATCH /api/usuarios/{id}/activar
- PATCH /api/usuarios/{id}/desactivar

### Productos
- GET /api/productos
- GET /api/productos/{id}
- POST /api/productos
- PUT /api/productos/{id}
- PATCH /api/productos/{id}/desactivar

### Proveedores
- GET /api/proveedores
- GET /api/proveedores/{id}
- POST /api/proveedores
- PUT /api/proveedores/{id}
- PATCH /api/proveedores/{id}/desactivar

### Órdenes de compra
- GET /api/ordenes
- GET /api/ordenes/{id}
- GET /api/ordenes/activa
- POST /api/ordenes
- PUT /api/ordenes/{id}
- PATCH /api/ordenes/{id}/estado
- POST /api/ordenes/{id}/detalles
- PUT /api/ordenes/{id}/detalles/{detalleId}
- DELETE /api/ordenes/{id}/detalles/{detalleId}
- POST /api/ordenes/{id}/cerrar

### Modo compra
- GET /api/compras/orden-activa
- PATCH /api/compras/ordenes/{id}/iniciar
- PATCH /api/compras/detalles/{detalleId}
- POST /api/compras/ordenes/{id}/agregar-producto
- PATCH /api/compras/ordenes/{id}/finalizar

### Recepción
- GET /api/recepcion/ordenes/{id}
- PATCH /api/recepcion/detalles/{detalleId}
- POST /api/recepcion/ordenes/{id}/calcular-precios
- POST /api/recepcion/ordenes/{id}/cerrar

### Reportes
- GET /api/reportes/diario
- GET /api/reportes/semanal
- GET /api/reportes/mensual
- GET /api/reportes/productos
- GET /api/reportes/proveedores

### Exportación
- GET /api/exportaciones/ordenes/{id}/excel

### Sincronización
- POST /api/sync/push
- GET /api/sync/pull
- GET /api/sync/estado

---

## 29. Reglas importantes para una IA que genere el sistema

La IA debe entender que:

1. El centro del sistema es la orden de compra.
2. La prioridad inicial no es stock completo ni POS, sino digitalizar compra, recepción y cálculo de precios.
3. El comprador necesita una vista simple y usable en terreno.
4. El sistema debe funcionar aunque el comprador no tenga internet.
5. El administrador necesita trazabilidad y reportes.
6. Los precios sugeridos son una ayuda, no una modificación automática del POS.
7. El margen se calcula sobre el precio de venta.
8. Las compras sin factura usan costo considerado = costo real * 1,19.
9. Las categorías son opcionales.
10. Los formatos deben ser flexibles.
11. El MVP debe evitar complejidad innecesaria.
12. Las eliminaciones deben evitarse; se prefiere anular o inactivar.
13. La integración con Eleventa queda fuera del MVP.
14. Los gráficos quedan fuera del MVP.
15. Los reportes iniciales deben ser tablas simples.
16. El historial completo puede ampliarse en versiones posteriores.

---

## 30. Instrucción recomendada para otra IA

Usa este documento como contexto base para diseñar y generar un sistema digital de compras para una verdulería.

Primero debes priorizar el MVP, no intentar construir todas las funcionalidades futuras.

El sistema debe centrarse en:
- Gestión de órdenes de compra.
- Modo compra para comprador.
- Recepción de mercadería.
- Cálculo de precios sugeridos.
- Exportación a Excel.
- Historial básico.
- Reportes administrativos simples.
- Funcionamiento offline en Android.

Cuando generes código, modelos, endpoints, pantallas o arquitectura, respeta las reglas de negocio descritas en este documento.
No inventes integraciones con POS, stock avanzado, gráficos o auditoría completa si no se solicitan explícitamente.

---

## 31. Pendientes de definición

Antes de construir el sistema completo, se deben validar o definir:

- Base de datos definitiva.
- Modelo exacto de usuarios y permisos.
- Tratamiento contable real de IVA.
- Reglas finales para compras con y sin factura.
- Si se usará PostgreSQL, MySQL u otra base de datos.
- Diseño exacto de sincronización offline.
- Diseño de pantallas Android.
- Diseño de pantallas web.
- Flujo exacto de exportación a Excel.
- Reglas para conflictos de sincronización.
- Nivel de detalle del historial.

---

## 32. Vista Global en Modo Compra

Durante la compra, el comprador puede alternar entre dos vistas dentro de la pantalla Modo Compra:

### Vista Detallada (por defecto)
Muestra cada producto como una tarjeta expandida con todos los campos de edición (cantidad, costo, factura, contenido por formato, comentario). Es la vista principal para completar datos de cada ítem.

### Vista Global
Lista compacta de una fila por producto, visible con el botón "Vista global" en el header. Muestra: nombre, formato, cantidad solicitada, costo ingresado y estado con color.

Al tocar una fila en Vista Global, el sistema regresa a Vista Detallada y hace scroll automático al card correspondiente.

### Reordenamiento de ítems
En Vista Global el comprador puede arrastrar los ítems (ícono ≡) para reorganizar la lista en el orden que prefiera para su recorrido. Este orden es visual y persiste durante la sesión pero no se guarda en el backend.

### Criterios de orden rápido
Disponibles en Vista Global como punto de partida antes de ajustar manualmente:
- **Por estado**: Pendientes primero, luego parciales, luego no comprados, luego comprados.
- **A→Z**: Orden alfabético por nombre de producto.
- **Original**: Orden original de la orden de compra.

El orden aplicado por cualquiera de estos criterios puede seguir siendo ajustado manualmente con drag & drop. El sistema indica cuando el orden es "Personalizado".

### Implementación
- Librería: `@dnd-kit/core` y `@dnd-kit/sortable` (soporta touch para Android/tablet).
- Solo afecta `ModoCompra.tsx`, sin cambios en backend ni en otros componentes.
- Los productos agregados en el mercado se añaden al final del orden actual.
