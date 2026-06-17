package com.verduleria.backend.repository;

import com.verduleria.backend.model.VentaArticulo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VentaArticuloRepository extends JpaRepository<VentaArticulo, Long> {

    boolean existsByTicketIdAndProductoCodigo(Long ticketId, String productoCodigo);
}
