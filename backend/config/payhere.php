<?php
define('PAYHERE_MERCHANT_ID', getenv('PAYHERE_MERCHANT_ID') ?: '1236886');
define('PAYHERE_MERCHANT_SECRET', getenv('PAYHERE_MERCHANT_SECRET') ?: '');
define('PAYHERE_CURRENCY', getenv('PAYHERE_CURRENCY') ?: 'LKR');
define('PAYHERE_SANDBOX', getenv('PAYHERE_SANDBOX') !== 'false');
?>
