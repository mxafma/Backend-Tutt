package com.verduleria.backend.repository;

import com.verduleria.backend.model.DetalleOrden;
import com.verduleria.backend.model.EstadoOrden;
import com.verduleria.backend.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleOrdenRepository extends JpaRepository<DetalleOrden, Long> {
    List<DetalleOrden> findByOrden_Id(Long ordenId);
    List<DetalleOrden> findByOrden_IdAndEstadoProducto(Long ordenId, String estadoProducto);

    long countByProducto_Id(Long productoId);

    @Modifying
    @Query("UPDATE DetalleOrden d SET d.producto = :nuevo WHERE d.producto = :viejo")
    int reasignarProducto(@Param("viejo") Producto viejo, @Param("nuevo") Producto nuevo);

    @Query("SELECT d FROM DetalleOrden d JOIN FETCH d.orden o LEFT JOIN FETCH o.proveedor WHERE d.producto.id = :productoId AND o.estado IN :estados ORDER BY o.fechaCompraReal DESC NULLS LAST, o.fechaCompraPlanificada DESC")
    List<DetalleOrden> findHistorialByProductoId(@Param("productoId") Long productoId, @Param("estados") List<EstadoOrden> estados);
}
