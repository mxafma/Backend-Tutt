package com.verduleria.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Entity
@Table(name = "productos")
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Categoria categoria;

    // Columna legacy VARCHAR NOT NULL que aún existe en la DB.
    // Se puede eliminar con: ALTER TABLE productos ALTER COLUMN categoria DROP NOT NULL;
    @JsonIgnore
    @Column(name = "categoria", nullable = false, updatable = false)
    private String categoriaLegacy = "";

    private String formatoHabitual;

    private Double margenRecomendado;

    @Column(nullable = false)
    private Boolean activo = true;
}
