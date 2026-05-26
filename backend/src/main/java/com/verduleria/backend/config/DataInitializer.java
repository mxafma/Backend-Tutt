package com.verduleria.backend.config;

import com.verduleria.backend.model.Usuario;
import com.verduleria.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) {
        crearSiNoExiste("admin",      "N2k14", "ADMIN",       "Administrador");
        crearSiNoExiste("comprador",  "1234",  "COMPRADOR",   "Comprador");
        crearSiNoExiste("cierre",     "1234",  "CREADOR_OC",  "Encargado Cierre");
        crearSiNoExiste("recepcion",  "1234",  "RECEPCION",   "Recepción");
    }

    private void crearSiNoExiste(String username, String password, String rol, String nombre) {
        if (usuarioRepository.findByUsername(username).isEmpty()) {
            Usuario u = new Usuario();
            u.setUsername(username);
            u.setPassword(encoder.encode(password));
            u.setRol(rol);
            u.setNombre(nombre);
            u.setActivo(true);
            usuarioRepository.save(u);
        }
    }
}
