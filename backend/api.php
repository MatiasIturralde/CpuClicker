<?php
// Simple router para acciones de usuario: register, login, ranking
// Soporte CORS básico para desarrollo local
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	// respuesta para preflight
	http_response_code(200);
	exit;
}

// Manejo seguro para capturar errores y devolver JSON
$action = $_GET['action'] ?? $_POST['action'] ?? '';
try {
	require_once __DIR__ . '/controller/UsuarioController.php';
	$ctrl = new UsuarioController();

	switch ($action) {
		case 'register':
			$ctrl->register();
			break;
		case 'login':
			$ctrl->login();
			break;
		case 'updateClicks':
			$ctrl->updateClicks();
			break;
		case 'getCpuInfo':
			$ctrl->getCpuInfo();
			break;
		case 'ranking':
			$ctrl->ranking();
			break;
		default:
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode(['success' => false, 'message' => 'Acción inválida']);
			break;
	}
} catch (Throwable $e) {
	header('Content-Type: application/json; charset=utf-8');
	http_response_code(500);
	// Enviar mensaje sin HTML
	echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
