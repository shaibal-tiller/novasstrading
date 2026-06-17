<?php
// ============================================================
//  process_form.php  –  Novasstrading Contact Form Handler (Brevo API Edition)
//  Location: public_html/process_form.php
// ============================================================

// ── CONFIGURATION ───────────────────────────────────────────
$to            = "info@novasstrading.com"; 
$site          = "Novasstrading";
$domain        = "novasstrading.com";
$brevo_api_key = "REMOVED — see .env file in project root";

// Allowed origins for secure Cross-Origin Resource Sharing (CORS)
$allowed_origins = [
    "https://novasstrading.com",
    "https://www.novasstrading.com",
    "http://novasstrading.com",
    "http://www.novasstrading.com",
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

// ── REQUEST CHECK ───────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed.');
}

// ── SECURITY LAYER: Honeypot Validation ─────────────────────
if (!empty($_POST['fax_number'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true, 
        'message' => 'Thank you! Your bulk inquiry has been successfully processed.'
    ]);
    exit;
}

// Input Sanitation Helper
function clean($val) {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

// ── COLLECT INCOMING FORM DATA ──────────────────────────────
$name        = clean($_POST['name']        ?? '');
$company     = clean($_POST['company']     ?? '');
$email       = clean($_POST['email']       ?? '');
$phone       = clean($_POST['phone']       ?? '');
$country     = clean($_POST['country']     ?? '');
$subject     = clean($_POST['subject']     ?? 'General Inquiry');
$message     = clean($_POST['message']     ?? '');
$form_source = clean($_POST['form_source'] ?? 'Website');

// ── VALIDATION LAYER ────────────────────────────────────────
$errors = [];
if (empty($name) || empty($email) || empty($message)) {
    $errors[] = "Please fill out all required fields.";
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Invalid email address.";
}

if (!empty($errors)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// ── 1. SEND NOTIFICATION TO ADMIN (Your Team) ───────────────
$admin_body  = "You have received a new inquiry via the {$site} website.\n";
$admin_body .= "Source Page : {$form_source}\n";
$admin_body .= str_repeat("-", 50) . "\n\n";
$admin_body .= "CONTACT DETAILS\n";
$admin_body .= "Name         : {$name}\n";
$admin_body .= "Company      : " . ($company ?: "—") . "\n";
$admin_body .= "Email        : {$email}\n";
$admin_body .= "Phone        : " . ($phone   ?: "—") . "\n";
$admin_body .= "Country      : " . ($country ?: "—") . "\n\n";
$admin_body .= "MESSAGE\n";
$admin_body .= wordwrap($message, 72, "\n", true) . "\n\n";
$admin_body .= str_repeat("-", 50) . "\n";
$admin_body .= "Sent via verified Brevo API integration.\n";

$url = 'https://api.brevo.com/v3/smtp/email';

$admin_email_data = [
    'sender' => ['name' => $site, 'email' => "noreply@{$domain}"],
    'to' => [['email' => $to, 'name' => $site]],
    'subject' => "[{$site}] New Inquiry: {$subject}",
    'textContent' => $admin_body,
    'replyTo' => ['email' => $email, 'name' => $name] // Clicking reply goes to user
];

$admin_options = [
    'http' => [
        'header'  => "Accept: application/json\r\n" .
                     "API-Key: {$brevo_api_key}\r\n" .
                     "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($admin_email_data),
        'ignore_errors' => true
    ]
];

$admin_context  = stream_context_create($admin_options);
$admin_result = file_get_contents($url, false, $admin_context);
$admin_status = json_decode($admin_result, true);

// ── 2. SEND AUTO-REPLY TO CUSTOMER ──────────────────────────
// Custom conversation-style text structure to bypass aggressive spam filters
$reply_body  = "Hi {$name},\n\n";
$reply_body .= "I just wanted to quickly confirm that we received your message regarding your recent inquiry. Our sourcing team is reviewing your details now, and we will follow up with you within the next 1–2 business days.\n\n";
$reply_body .= "If you need immediate assistance in the meantime, feel free to reply directly to this email or reach us at +880-17XXXXXXXX.\n\n";
$reply_body .= "Talk soon,\n";
$reply_body .= "The Novasstrading Team\n";
$reply_body .= "info@{$domain}\n";
$reply_body .= "www.{$domain}\n";

$customer_email_data = [
    'sender' => ['name' => $site, 'email' => "info@{$domain}"],
    'to' => [['email' => $email, 'name' => $name]],
    'subject' => "Re: Your Inquiry with Novasstrading", // Conversational prefix
    'textContent' => $reply_body
];

$customer_options = [
    'http' => [
        'header'  => "Accept: application/json\r\n" .
                     "API-Key: {$brevo_api_key}\r\n" .
                     "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($customer_email_data),
        'ignore_errors' => true
    ]
];

$customer_context  = stream_context_create($customer_options);
$customer_result = file_get_contents($url, false, $customer_context);

// ── 3. ROUTE COMPLETED RESPONSE BACK TO WEB FRONTEND ────────
$is_ajax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

// Verify if Brevo accepted the transaction processing payload
$success = isset($admin_status['messageId']);

if ($is_ajax) {
    header('Content-Type: application/json');
    if ($success) {
        echo json_encode([
            'success' => true, 
            'message' => "Thank you {$name}! Your inquiry has been processed securely via authenticated email channels."
        ]);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => "Internal processing issue. Please email us directly at info@novasstrading.com"
        ]);
    }
} else {
    $redirect = $_SERVER['HTTP_REFERER'] ?? "https://{$domain}/contact";
    $status = $success ? "success" : "error";
    header("Location: {$redirect}?status={$status}");
}
exit;