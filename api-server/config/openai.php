<?php

return [
    'api_key' => env('OPENAI_API_KEY'),
    'organization' => env('OPENAI_ORGANIZATION'),
    'request_timeout' => (int) env('OPENAI_REQUEST_TIMEOUT', 30),
];
