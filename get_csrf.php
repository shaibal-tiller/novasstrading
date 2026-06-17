<?php
// ============================================================
//  get_csrf.php  –  CSRF Token Endpoint
//  Call this via fetch() when the contact page loads.
//  Place this file in the same directory as process_form.php.
// ============================================================

session_start();

header('Content-Type: application/json');
header('Cache-Control: no-store');

// Generate a fresh token if none exists in session
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

echo json_encode(['csrf_token' => $_SESSION['csrf_token']]);
