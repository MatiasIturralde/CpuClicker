<?php
require_once __DIR__ . '/Conexion.php';

class UsuarioModel {
	private $conn;
	private $table;
	private $hasNivel;

	public function __construct()
	{
		$this->conn = (new Conexion())->getConexion();
		$this->detectTable();
	}

	private function detectTable()
	{
		// Preferir 'usuarios' pero soportar 'usuario' si existe
		$candidate = null;
		$stmt = $this->conn->prepare("SHOW TABLES LIKE 'usuarios'");
		$stmt->execute();
		if ($stmt->fetch()) {
			$candidate = 'usuarios';
		} else {
			$stmt = $this->conn->prepare("SHOW TABLES LIKE 'usuario'");
			$stmt->execute();
			if ($stmt->fetch()) {
				$candidate = 'usuario';
			}
		}

		if (!$candidate) {
			throw new Exception('No se encontró la tabla usuarios/usuario en la base de datos');
		}

		$this->table = $candidate;

		// Comprobar si tiene columna nivel
		$stmt = $this->conn->prepare("SHOW COLUMNS FROM `" . $this->table . "` LIKE 'nivel'");
		$stmt->execute();
		$this->hasNivel = (bool) $stmt->fetch();

		// Asegurar que la columna `contra` tenga suficiente tamaño para hashes
		try {
			$stmt = $this->conn->prepare("SHOW COLUMNS FROM `" . $this->table . "` LIKE 'contra'");
			$stmt->execute();
			$col = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($col && isset($col['Type'])) {
				// Type puede ser varchar(30) u otros
				if (preg_match('/varchar\((\d+)\)/i', $col['Type'], $m)) {
					$len = (int) $m[1];
					if ($len < 60) {
						// intentar alterar la columna a VARCHAR(255)
						$alter = $this->conn->prepare("ALTER TABLE `" . $this->table . "` MODIFY `contra` VARCHAR(255) NOT NULL");
						$alter->execute();
					}
				}
			}
		} catch (Exception $e) {
			// No interrumpir si falla el alter; seguiremos intentando usar la tabla
		}
	}

	// Registra un nuevo usuario con password hasheado
	public function register(string $nombre, string $password)
	{
		// comprobar si existe
		$stmt = $this->conn->prepare('SELECT id FROM `'. $this->table .'` WHERE nombre = :nombre');
		$stmt->execute([':nombre' => $nombre]);
		if ($stmt->fetch()) {
			return ['success' => false, 'message' => 'Usuario ya existe'];
		}

		$hash = password_hash($password, PASSWORD_DEFAULT);
		// Insertar usando las columnas de la BD: contra, numeroClick, nivel (nivel puede no existir pero por seguridad intentamos usar 0)
		if ($this->hasNivel) {
			$sql = 'INSERT INTO `'. $this->table .'` (nombre, contra, numeroClick, nivel) VALUES (:nombre, :contra, 0, 0)';
			$stmt = $this->conn->prepare($sql);
			$stmt->execute([':nombre' => $nombre, ':contra' => $hash]);
		} else {
			$sql = 'INSERT INTO `'. $this->table .'` (nombre, contra, numeroClick) VALUES (:nombre, :contra, 0)';
			$stmt = $this->conn->prepare($sql);
			$stmt->execute([':nombre' => $nombre, ':contra' => $hash]);
		}

		return ['success' => true, 'id' => $this->conn->lastInsertId()];
	}

	// Login: verifica credenciales y devuelve datos básicos
	public function login(string $nombre, string $password)
	{
		$stmt = $this->conn->prepare('SELECT * FROM `'. $this->table .'` WHERE nombre = :nombre');
		$stmt->execute([':nombre' => $nombre]);
		$user = $stmt->fetch(PDO::FETCH_ASSOC);
		if (!$user) {
			return ['success' => false, 'message' => 'Usuario no encontrado'];
		}
		$stored = $user['contra'];

		// Soportar contraseñas en texto plano (legacy) y hashes
		if (password_verify($password, $stored)) {
			// ok
		} elseif ($stored === $password) {
			// coincide en texto plano: re-hash y actualizar
			$newHash = password_hash($password, PASSWORD_DEFAULT);
			$upd = $this->conn->prepare('UPDATE `'. $this->table .'` SET contra = :contra WHERE id = :id');
			$upd->execute([':contra' => $newHash, ':id' => $user['id']]);
			$user['contra'] = $newHash;
		} else {
			return ['success' => false, 'message' => 'Contraseña incorrecta'];
		}

		return ['success' => true, 'user' => $this->mapUserRow($user)];
	}

	// Obtener usuario por id y mapear campos
	public function getById(int $id)
	{
		$stmt = $this->conn->prepare('SELECT * FROM `'. $this->table .'` WHERE id = :id');
		$stmt->execute([':id' => $id]);
		$row = $stmt->fetch(PDO::FETCH_ASSOC);
		if (!$row) return null;
		return $this->mapUserRow($row);
	}

	private function mapUserRow(array $row)
	{
		$clicks = isset($row['numeroClick']) ? (int)$row['numeroClick'] : 0;
		$nivel = 1 + (int) floor($clicks / 100);
		$user = [
			'id' => isset($row['id']) ? (int)$row['id'] : null,
			'nombre' => $row['nombre'] ?? null,
			'clicks' => $clicks,
			'nivel' => $nivel
		];

		// Campos opcionales
		if (isset($row['imagen'])) $user['imagen'] = $row['imagen'];
		if (isset($row['avatar'])) $user['imagen'] = $row['avatar'];
		if (isset($row['cpuActual'])) $user['cpuActual'] = $row['cpuActual'];
		if (isset($row['cantidadCpu'])) $user['cantidadCpu'] = $row['cantidadCpu'];

		return $user;
	}

	// Obtiene ranking por clicks (desc)
	public function getRanking(int $limit = 100)
	{
		$sql = 'SELECT nombre, numeroClick FROM `'. $this->table .'` ORDER BY numeroClick DESC LIMIT :limit';
		$stmt = $this->conn->prepare($sql);
		$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
		$stmt->execute();
		$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
		// Mapear a nombre + clicks
		$out = [];
		foreach ($rows as $r) {
			$clicks = isset($r['numeroClick']) ? (int)$r['numeroClick'] : 0;
			$out[] = ['nombre' => $r['nombre'], 'clicks' => $clicks];
		}
		return $out;
	}

	// Actualiza el número de clicks de un usuario (útil desde el juego)
	public function updateClicks(int $id, int $clicks)
	{
		// Actualizar numeroClick y nivel (si existe)
		$nivel = 1 + (int) floor($clicks / 100);
		if ($this->hasNivel) {
			$sql = 'UPDATE `'. $this->table .'` SET numeroClick = :clicks, nivel = :nivel WHERE id = :id';
			$stmt = $this->conn->prepare($sql);
			return $stmt->execute([':clicks' => $clicks, ':nivel' => $nivel, ':id' => $id]);
		} else {
			$sql = 'UPDATE `'. $this->table .'` SET numeroClick = :clicks WHERE id = :id';
			$stmt = $this->conn->prepare($sql);
			return $stmt->execute([':clicks' => $clicks, ':id' => $id]);
		}
	}
}

// Clase helper para gestionar info de CPUs
class CpuHelper {
	private static $totalCpus = 20;
	private static $clicksPerCpu = 500;

	public static function getCpuFromClicks(int $clicks): int
	{
		// CPU actual basado en clicks: CPU 1 (0-499), CPU 2 (500-999), etc.
		$cpuId = 1 + (int) floor($clicks / self::$clicksPerCpu);
		return min($cpuId, self::$totalCpus);
	}

	public static function getAllCpus(): array
	{
		$cpus = [];
		for ($i = 1; $i <= self::$totalCpus; $i++) {
			$cpus[] = [
				'id' => $i,
				'nombre' => 'CPU ' . $i,
				'imagen' => './backend/Recursos/Imagenes-CPUs/CPU-' . $i . '.png',
				'clicksRequired' => ($i - 1) * self::$clicksPerCpu,
				'clicksToNext' => $i * self::$clicksPerCpu
			];
		}
		return $cpus;
	}

	public static function getCpuStatus(int $clicks): array
	{
		$currentCpu = self::getCpuFromClicks($clicks);
		return [
			'currentCpu' => $currentCpu,
			'clicks' => $clicks,
			'cpuName' => 'CPU ' . $currentCpu,
			'cpuImage' => './backend/Recursos/Imagenes-CPUs/CPU-' . $currentCpu . '.png'
		];
	}
}

?>
