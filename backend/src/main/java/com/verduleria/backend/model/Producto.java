package com.verduleria.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "productos")
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    private String categoria;

    private String formatoHabitual;

    private Double margenRecomendado;

    @Column(nullable = false)
    private Boolean activo = true;
}
