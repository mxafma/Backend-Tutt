package com.verduleria.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Entity
@Table(name = "detalle_ordenes")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"orden"})
public class DetalleOrden {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_id", nullable = false)
    @JsonIgnore
    private OrdenCompra orden;

    @ManyToOne
    @JoinColumn(name = "producto_id")
    private Producto producto;

    private String nombreProductoSnapshot;

    private String formato;

    private Double cantidadSolicitada;

    private Double cantidadComprada;

    private Double costoTotal;

    private Boolean factura;

    private String comentario;

    private String estadoProducto;

    private String tipoPago;

    private Double cantidadInterna;

    private Double costoUnitarioCalculado;

    private Double precioSugerido;

    private Double margenSugerido;

    private Double precioFinalEditado;

    private Double margenResultante;

    private Boolean agregadoEnMercado;
}
