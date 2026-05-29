package com.verduleria.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "ordenes_compra")
public class OrdenCompra {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    private String fechaCompraPlanificada;

    private String fechaCompraReal;

    @Column(nullable = false)
    private String estado;

    private String tipoCompra;

    private Long creadorId;
    private String creadorNombre;

    private Long compradorAsignadoId;
    private String compradorAsignadoNombre;

    private String encargadoCompra;

    private Long proveedorId;
    private String proveedorNombre;

    private String lugarCompra;

    private String observaciones;

    private Double total;

    @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleOrden> detalles;
}
