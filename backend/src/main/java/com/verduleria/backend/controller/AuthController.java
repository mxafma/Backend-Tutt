package com.verduleria.backend.controller;

import com.verduleria.backend.config.JwtUtil;
import com.verduleria.backend.model.Usuario;
import com.verduleria.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        return usuarioRepository.findByUsername(username)
                .filter(u -> u.isActivo() && encoder.matches(password, u.getPassword()))
                .map(u -> {
                    String token = jwtUtil.generate(u.getUsername(), u.getRol());
                    return ResponseEntity.ok(Map.of(
                            "token", token,
                            "user", toView(u)
                    ));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Usuario o contraseña incorrectos")));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = auth.substring(7);
        if (!jwtUtil.isValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String username = jwtUtil.getUsername(token);
        return usuarioRepository.findByUsername(username)
                .filter(Usuario::isActivo)
                .map(u -> ResponseEntity.ok(toView(u)))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
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
