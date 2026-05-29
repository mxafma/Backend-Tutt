package com.verduleria.backend.config;

import com.verduleria.backend.model.Usuario;
import com.verduleria.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Value("${INIT_PASSWORD_ADMIN:changeme_admin}")
    private String passwordAdmin;

    @Value("${INIT_PASSWORD_COMPRADOR:changeme_comprador}")
    private String passwordComprador;

    @Value("${INIT_PASSWORD_CIERRE:changeme_cierre}")
    private String passwordCierre;

    @Value("${INIT_PASSWORD_RECEPCION:changeme_recepcion}")
    private String passwordRecepcion;

    @Override
    public void run(String... args) {
        crearSiNoExiste("admin",     passwordAdmin,     "ADMIN",      "Administrador");
        crearSiNoExiste("comprador", passwordComprador, "COMPRADOR",  "Comprador");
        crearSiNoExiste("cierre",    passwordCierre,    "CREADOR_OC", "Encargado Cierre");
        crearSiNoExiste("recepcion", passwordRecepcion, "RECEPCION",  "Recepción");
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
