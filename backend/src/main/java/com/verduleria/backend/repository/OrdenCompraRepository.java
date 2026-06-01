package com.verduleria.backend.repository;

import com.verduleria.backend.model.EstadoOrden;
import com.verduleria.backend.model.OrdenCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdenCompraRepository extends JpaRepository<OrdenCompra, Long> {
    List<OrdenCompra> findByEstado(EstadoOrden estado);
    List<OrdenCompra> findByEstadoIn(List<EstadoOrden> estados);
    List<OrdenCompra> findByCreador_Id(Long creadorId);
    List<OrdenCompra> findByCompradorAsignado_Id(Long compradorId);
    Optional<OrdenCompra> findFirstByEstadoInOrderByFechaCreacionDesc(List<EstadoOrden> estados);
}
