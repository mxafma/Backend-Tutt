package com.verduleria.backend.service;

import com.verduleria.backend.model.*;
import com.verduleria.backend.repository.OrdenCompraRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OrdenCompraService {

    @Autowired
    private OrdenCompraRepository ordenCompraRepository;

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<OrdenCompra> obtenerTodas() {
        return ordenCompraRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<OrdenCompra> obtenerPorId(Long id) {
        return ordenCompraRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<OrdenCompra> obtenerActiva() {
        return ordenCompraRepository.findFirstByEstadoInOrderByFechaCreacionDesc(
                List.of(EstadoOrden.LISTA_PARA_COMPRAR, EstadoOrden.EN_COMPRA)
        );
    }

    @Transactional
    public OrdenCompra guardar(OrdenCompra datos) {
        OrdenCompra orden = new OrdenCompra();
        orden.setEstado(datos.getEstado() != null ? datos.getEstado() : EstadoOrden.BORRADOR);
        orden.setFechaCompraPlanificada(datos.getFechaCompraPlanificada());
        orden.setTipoCompra(datos.getTipoCompra());
        orden.setLugarCompra(datos.getLugarCompra());
        orden.setObservaciones(datos.getObservaciones());
        orden.setTotal(datos.getTotal());
        resolverRelaciones(orden, datos);

        if (datos.getDetalles() != null) {
            List<DetalleOrden> detalles = new ArrayList<>();
            int pos = 0;
            for (DetalleOrden d : datos.getDetalles()) {
                d.setId(null);
                d.setOrden(orden);
                d.setPosicion(pos++);
                if (d.getEstadoProducto() == null) d.setEstadoProducto("PENDIENTE");
                if (d.getAgregadoEnMercado() == null) d.setAgregadoEnMercado(false);
                resolverProducto(d);
                detalles.add(d);
            }
            orden.setDetalles(detalles);
        }

        return ordenCompraRepository.save(orden);
    }

    @Transactional
    public OrdenCompra actualizar(Long id, OrdenCompra datos) {
        OrdenCompra orden = ordenCompraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada: " + id));

        if (datos.getFechaCompraPlanificada() != null) orden.setFechaCompraPlanificada(datos.getFechaCompraPlanificada());
        if (datos.getTipoCompra() != null) orden.setTipoCompra(datos.getTipoCompra());
        if (datos.getEstado() != null) orden.setEstado(datos.getEstado());
        if (datos.getLugarCompra() != null) orden.setLugarCompra(datos.getLugarCompra());
        if (datos.getObservaciones() != null) orden.setObservaciones(datos.getObservaciones());
        resolverRelaciones(orden, datos);

        orden.getDetalles().clear();
        if (datos.getDetalles() != null) {
            int pos = 0;
            for (DetalleOrden d : datos.getDetalles()) {
                d.setId(null);
                d.setOrden(orden);
                d.setPosicion(pos++);
                if (d.getEstadoProducto() == null) d.setEstadoProducto("PENDIENTE");
                if (d.getAgregadoEnMercado() == null) d.setAgregadoEnMercado(false);
                resolverProducto(d);
                orden.getDetalles().add(d);
            }
        }

        return ordenCompraRepository.save(orden);
    }

    @Transactional
    public OrdenCompra actualizarEstado(Long id, EstadoOrden nuevoEstado) {
        OrdenCompra orden = ordenCompraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada: " + id));
        orden.setEstado(nuevoEstado);
        return ordenCompraRepository.save(orden);
    }

    private void resolverRelaciones(OrdenCompra destino, OrdenCompra fuente) {
        Long proveedorId = fuente.getProveedorId();
        destino.setProveedor(proveedorId != null ? em.getReference(Proveedor.class, proveedorId) : null);

        Long compradorId = fuente.getCompradorAsignadoId();
        destino.setCompradorAsignado(compradorId != null ? em.getReference(Usuario.class, compradorId) : null);

        Long creadorId = fuente.getCreadorId();
        if (creadorId != null) destino.setCreador(em.getReference(Usuario.class, creadorId));
    }

    private void resolverProducto(DetalleOrden d) {
        if (d.getProducto() != null && d.getProducto().getId() != null) {
            Producto p = em.find(Producto.class, d.getProducto().getId());
            if (p == null) throw new RuntimeException("Producto no encontrado: " + d.getProducto().getId());
            d.setProducto(p);
        }
    }
}
