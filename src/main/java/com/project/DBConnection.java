package com.project;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public final class DBConnection {

    private static final String CONFIG_FILE = "config.properties";

    private DBConnection() {
    }

    public static Connection getConnection() throws SQLException {
        Properties properties = loadProperties();

        String url = requireProperty(properties, "db.url");
        String username = requireProperty(properties, "db.username");
        String password = requireProperty(properties, "db.password");

        try {
            Class.forName("oracle.jdbc.OracleDriver");
        } catch (ClassNotFoundException e) {
            throw new SQLException("Oracle JDBC driver class not found.", e);
        }

        return DriverManager.getConnection(url, username, password);
    }

    private static Properties loadProperties() throws SQLException {
        Properties properties = new Properties();

        ClassLoader classLoader = DBConnection.class.getClassLoader();

        try (InputStream input =
                     classLoader.getResourceAsStream(CONFIG_FILE)) {

            if (input == null) {
                throw new SQLException(
                    "config.properties not found on the application classpath."
                );
            }

            properties.load(input);
            return properties;

        } catch (IOException e) {
            throw new SQLException(
                "Unable to read config.properties.", e
            );
        }
    }

    private static String requireProperty(
            Properties properties, String key) throws SQLException {

        String value = properties.getProperty(key);

        if (value == null || value.trim().isEmpty()) {
            throw new SQLException(
                "Missing required database property: " + key
            );
        }

        return value.trim();
    }
}