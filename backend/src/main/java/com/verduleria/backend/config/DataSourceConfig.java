package com.verduleria.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    DataSource dataSource() throws URISyntaxException {
        String databaseUrl = System.getenv("DATABASE_URL");

        if (databaseUrl == null || databaseUrl.isBlank()) {
            return buildFromIndividualVars();
        }

        return buildFromUrl(databaseUrl);
    }

    private DataSource buildFromUrl(String databaseUrl) throws URISyntaxException {
        URI uri = new URI(databaseUrl);

        String host = uri.getHost();
        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String[] userInfo = uri.getUserInfo().split(":", 2);
        String username = userInfo[0];
        String password = userInfo.length > 1 ? userInfo[1] : "";
        String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + uri.getPath();

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(config);
    }

    private DataSource buildFromIndividualVars() {
        String host = getEnv("PGHOST", "localhost");
        String port = getEnv("PGPORT", "5432");
        String db   = getEnv("PGDATABASE", "verduleria");
        String user = getEnv("PGUSER", "postgres");
        String pass = getEnv("PGPASSWORD", getEnv("POSTGRES_PASSWORD", "12345"));

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://" + host + ":" + port + "/" + db);
        config.setUsername(user);
        config.setPassword(pass);
        config.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(config);
    }

    private static String getEnv(String name, String defaultValue) {
        String value = System.getenv(name);
        return (value != null && !value.isBlank()) ? value : defaultValue;
    }
}
