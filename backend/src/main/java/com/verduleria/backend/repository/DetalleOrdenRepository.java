package com.verduleria.backend.repository;

import com.verduleria.backend.model.DetalleOrden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleOrdenRepository extends JpaRepository<DetalleOrden, Long> {
    List<DetalleOrden> findByOrden_Id(Long ordenId);
    List<DetalleOrden> findByOrden_IdAndEstadoProducto(Long ordenId, String estadoProducto);
}
