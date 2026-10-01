<?php
require __DIR__ . '/../vendor/autoload.php';

putenv('DB_DSN=mysql:host=localhost;dbname=nova_assets_test;charset=utf8mb4');
putenv('DB_USER=nova_test');
putenv('DB_PASS=nova_test_pw');
putenv('API_KEY=test-api-key');
putenv('SESSION_SECRET=test-session-secret-please-override-in-prod');
// Fake value — tests always inject a fake mailer callable into AuthController,
// so the real Brevo API is never actually called during the test suite.
putenv('BREVO_API_KEY=test-brevo-api-key');

