<?php

class Conexion {
    private $host = 'localhost';
    private $db = 'cpuclicker';
    private $user = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    private $connection;

    public function __construct() {
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db . ";charset=" . $this->charset;
            $this->connection = new PDO($dsn, $this->user, $this->password);
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die('Error de conexión: ' . $e->getMessage());
        }
    }

    public function getConexion() {
        return $this->connection;
    }
}

?>