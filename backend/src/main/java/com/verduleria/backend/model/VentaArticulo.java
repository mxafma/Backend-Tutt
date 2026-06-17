package com.verduleria.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Mapea la tabla eleventa.ventatickets_articulos en PostgreSQL.
 * Las columnas se declaran explícitamente para que Hibernate (ddl-auto=update)
 * no intente alterar la tabla, que ya existe en Railway.
 */
@Data
@Entity
@Table(name = "ventatickets_articulos", schema = "eleventa")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class VentaArticulo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "folio")
    private Integer folio;

    @Column(name = "cajero_id")
    private Integer cajeroId;

    @Column(name = "cajero_nombre")
    private String cajeroNombre;

    @Column(name = "vendido_en")
    private LocalDateTime vendidoEn;

    @Column(name = "forma_pago")
    private String formaPago;

    @Column(name = "turno_id")
    private Integer turnoId;

    @Column(name = "cliente_id")
    private Integer clienteId;

    @Column(name = "producto_codigo")
    private String productoCodigo;

    @Column(name = "producto_nombre")
    private String productoNombre;

    @Column(name = "cantidad")
    private Double cantidad;

    @Column(name = "precio_usado")
    private Long precioUsado;

    @Column(name = "precio_final")
    private Long precioFinal;

    @Column(name = "total_articulo")
    private Long totalArticulo;

    @Column(name = "linea_ganancia")
    private Long lineaGanancia;

    @Column(name = "fue_devuelto")
    private String fueDevuelto;
}
