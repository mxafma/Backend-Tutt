package com.verduleria.backend.repository;

import com.verduleria.backend.model.DetalleOrden;
import com.verduleria.backend.model.EstadoOrden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleOrdenRepository extends JpaRepository<DetalleOrden, Long> {
    List<DetalleOrden> findByOrden_Id(Long ordenId);
    List<DetalleOrden> findByOrden_IdAndEstadoProducto(Long ordenId, String estadoProducto);

    @Query("SELECT d FROM DetalleOrden d JOIN FETCH d.orden o LEFT JOIN FETCH o.proveedor WHERE d.producto.id = :productoId AND o.estado IN :estados ORDER BY o.fechaCompraReal DESC NULLS LAST, o.fechaCompraPlanificada DESC")
    List<DetalleOrden> findHistorialByProductoId(@Param("productoId") Long productoId, @Param("estados") List<EstadoOrden> estados);
}
