<?php
require_once __DIR__ . '/../model/UsuarioModel.php';

class UsuarioController {
	private $model;

	public function __construct()
	{
		$this->model = new UsuarioModel();
	}

	private function json($data)
	{
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($data);
		exit;
	}

	// Registrar usuario (lee JSON desde cuerpo)
	public function register()
	{
		$input = json_decode(file_get_contents('php://input'), true);
		$nombre = $input['nombre'] ?? '';
		$password = $input['password'] ?? '';

		if (!$nombre || !$password) {
			$this->json(['success' => false, 'message' => 'Faltan datos']);
		}

		$res = $this->model->register($nombre, $password);
		$this->json($res);
	}

	// Iniciar sesión
	public function login()
	{
		$input = json_decode(file_get_contents('php://input'), true);
		$nombre = $input['nombre'] ?? '';
		$password = $input['password'] ?? '';

		if (!$nombre || !$password) {
			$this->json(['success' => false, 'message' => 'Faltan datos']);
		}

		$res = $this->model->login($nombre, $password);
		// Si login OK, podemos devolver además más información (imagen, cpuActual...)
		if ($res['success']) {
			$userId = $res['user']['id'];
			$full = $this->model->getById($userId);
			if ($full) $res['user'] = $full;
		}
		$this->json($res);
	}

	// Actualizar clicks desde frontend (body JSON: id, clicks)
	public function updateClicks()
	{
		$input = json_decode(file_get_contents('php://input'), true);
		$id = isset($input['id']) ? (int)$input['id'] : 0;
		$clicks = isset($input['clicks']) ? (int)$input['clicks'] : null;
		if (!$id || $clicks === null) {
			$this->json(['success' => false, 'message' => 'Faltan datos']);
		}

		$ok = $this->model->updateClicks($id, $clicks);
		if ($ok) {
			$user = $this->model->getById($id);
			$this->json(['success' => true, 'user' => $user]);
		} else {
			$this->json(['success' => false, 'message' => 'No se pudo actualizar clicks']);
		}
	}

	// Obtener ranking/tabla de clasificación
	public function ranking()
	{
		$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
		$rows = $this->model->getRanking($limit);

		// Calcular nivel: asumimos nivel base 1 y aumenta +1 cada 100 clicks
		foreach ($rows as &$r) {
			$clicks = (int) $r['clicks'];
			$r['nivel'] = 1 + (int) floor($clicks / 100);
		}

		$this->json(['success' => true, 'data' => $rows]);
	}

	// Obtener info de CPUs y estado del usuario
	public function getCpuInfo()
	{
		$userId = isset($_GET['userId']) ? (int)$_GET['userId'] : 0;

		$allCpus = CpuHelper::getAllCpus();
		$userCpuStatus = null;

		if ($userId > 0) {
			$user = $this->model->getById($userId);
			if ($user) {
				$userClicks = $user['clicks'] ?? 0;
				$userCpuStatus = CpuHelper::getCpuStatus($userClicks);
			}
		}

		$this->json([
			'success' => true,
			'cpus' => $allCpus,
			'userStatus' => $userCpuStatus,
			'clicksPerCpu' => 500
		]);
	}
}

?>
