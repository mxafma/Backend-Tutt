package com.verduleria.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "ordenes_compra")
@JsonIgnoreProperties({"creador", "compradorAsignado", "proveedor"})
public class OrdenCompra {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    private LocalDate fechaCompraPlanificada;

    private LocalDateTime fechaCompraReal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoOrden estado;

    private String tipoCompra;
    private String lugarCompra;
    private String observaciones;
    private Double total;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creador_id")
    private Usuario creador;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comprador_asignado_id")
    private Usuario compradorAsignado;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleOrden> detalles;

    // Campos transient para compatibilidad con el frontend (campos planos)
    @Transient private Long creadorId;
    @Transient private String creadorNombre;
    @Transient private Long compradorAsignadoId;
    @Transient private String compradorAsignadoNombre;
    @Transient private String encargadoCompra;
    @Transient private Long proveedorId;
    @Transient private String proveedorNombre;

    public Long getCreadorId() { return creador != null ? creador.getId() : creadorId; }
    public String getCreadorNombre() { return creador != null ? creador.getNombre() : creadorNombre; }
    public Long getCompradorAsignadoId() { return compradorAsignado != null ? compradorAsignado.getId() : compradorAsignadoId; }
    public String getCompradorAsignadoNombre() { return compradorAsignado != null ? compradorAsignado.getNombre() : compradorAsignadoNombre; }
    public String getEncargadoCompra() { return compradorAsignado != null ? compradorAsignado.getNombre() : encargadoCompra; }
    public Long getProveedorId() { return proveedor != null ? proveedor.getId() : proveedorId; }
    public String getProveedorNombre() { return proveedor != null ? proveedor.getNombre() : proveedorNombre; }
}
