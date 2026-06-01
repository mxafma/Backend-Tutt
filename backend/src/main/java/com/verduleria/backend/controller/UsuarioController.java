package com.verduleria.backend.controller;

import com.verduleria.backend.model.Usuario;
import com.verduleria.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @GetMapping
    public List<Map<String, Object>> listar() {
        return usuarioRepository.findAll().stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(u -> ResponseEntity.ok(toView(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String nombre = (String) body.get("nombre");
        String rol = (String) body.get("rol");
        String password = (String) body.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Usuario y contraseña son obligatorios"));
        }
        if (usuarioRepository.findByUsername(email.trim()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El usuario ya existe"));
        }

        Usuario u = new Usuario();
        u.setUsername(email.trim());
        u.setNombre(nombre != null && !nombre.isBlank() ? nombre.trim() : email.trim());
        u.setRol(rol != null ? rol : "COMPRADOR");
        u.setPassword(encoder.encode(password));
        u.setActivo(true);

        return ResponseEntity.status(HttpStatus.CREATED).body(toView(usuarioRepository.save(u)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return usuarioRepository.findById(id).map(u -> {
            String nombre = (String) body.get("nombre");
            String rol = (String) body.get("rol");
            String password = (String) body.get("password");

            if (nombre != null && !nombre.isBlank()) u.setNombre(nombre.trim());
            if (rol != null) u.setRol(rol);
            if (password != null && !password.isBlank()) u.setPassword(encoder.encode(password));

            return ResponseEntity.ok(toView(usuarioRepository.save(u)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<?> activar(@PathVariable Long id) {
        return usuarioRepository.findById(id).map(u -> {
            u.setActivo(true);
            return ResponseEntity.ok(toView(usuarioRepository.save(u)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<?> desactivar(@PathVariable Long id) {
        return usuarioRepository.findById(id).map(u -> {
            u.setActivo(false);
            return ResponseEntity.ok(toView(usuarioRepository.save(u)));
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toView(Usuario u) {
        return Map.of(
                "id", u.getId(),
                "nombre", u.getNombre() != null ? u.getNombre() : u.getUsername(),
                "email", u.getUsername(),
                "rol", u.getRol(),
                "activo", u.isActivo()
        );
    }
}
