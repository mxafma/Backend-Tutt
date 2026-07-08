package com.verduleria.backend.repository;

import com.verduleria.backend.model.ProductoAlias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductoAliasRepository extends JpaRepository<ProductoAlias, Long> {
    Optional<ProductoAlias> findByNombreVentaNorm(String nombreVentaNorm);
}
