package com.verduleria.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

/**
 * Mapea un nombre de venta de Eleventa a un producto de compra (public.productos).
 *
 * Existe porque el cruce compra ↔ venta del reporte de rentabilidad se hace por
 * nombre normalizado, y eso falla cuando el POS usa otro nombre ("Papas Blancas"
 * vs "Papa") o cuando un mismo insumo se vende en varios formatos derivados
 * ("Malla papa 5kg", "Papa suelta"). Un alias por cada nombre de venta (N:1)
 * hace que esas ventas se agrupen sobre el producto de compra correcto.
 *
 * v1: solo reconcilia dinero/margen. El factor de conversión de cantidades
 * (kg comprado vs mallas vendidas) queda para una versión posterior.
 */
@Data
@Entity
@Table(name = "producto_alias")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProductoAlias {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nombre de venta de Eleventa normalizado (ProductoService.normalizar). Clave de búsqueda. */
    @Column(name = "nombre_venta_norm", nullable = false, unique = true)
    private String nombreVentaNorm;

    /** Nombre de venta tal cual llega de Eleventa, para mostrar en la UI. */
    @Column(name = "nombre_venta_original")
    private String nombreVentaOriginal;

    /** Producto de compra destino al que se atribuyen estas ventas. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;
}
