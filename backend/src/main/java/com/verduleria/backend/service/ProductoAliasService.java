package com.verduleria.backend.service;

import com.verduleria.backend.model.Producto;
import com.verduleria.backend.model.ProductoAlias;
import com.verduleria.backend.repository.ProductoAliasRepository;
import com.verduleria.backend.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Gestiona los alias nombre-de-venta → producto-de-compra usados por el reporte
 * de rentabilidad. Ver {@link ProductoAlias} para el porqué.
 */
@Service
public class ProductoAliasService {

    private final ProductoAliasRepository aliasRepo;
    private final ProductoRepository productoRepo;

    public ProductoAliasService(ProductoAliasRepository aliasRepo, ProductoRepository productoRepo) {
        this.aliasRepo = aliasRepo;
        this.productoRepo = productoRepo;
    }

    @Transactional(readOnly = true)
    public List<ProductoAlias> listar() {
        return aliasRepo.findAll();
    }

    /**
     * Vincula un nombre de venta a un producto de compra. Si ya existe un alias
     * para ese nombre (normalizado), se reapunta al nuevo producto (upsert).
     */
    @Transactional
    public ProductoAlias crear(String nombreVenta, Long productoId) {
        if (nombreVenta == null || nombreVenta.isBlank()) {
            throw new IllegalArgumentException("El nombre de venta es obligatorio");
        }
        Producto producto = productoRepo.findById(productoId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + productoId));

        String norm = ProductoService.normalizar(nombreVenta);
        ProductoAlias alias = aliasRepo.findByNombreVentaNorm(norm).orElseGet(ProductoAlias::new);
        alias.setNombreVentaNorm(norm);
        alias.setNombreVentaOriginal(nombreVenta.trim());
        alias.setProducto(producto);
        return aliasRepo.save(alias);
    }

    @Transactional
    public void eliminar(Long id) {
        aliasRepo.deleteById(id);
    }
}
