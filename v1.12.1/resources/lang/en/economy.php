<?php

return [
    'allowed_nodes' => [
        'title' => 'Allowed Nodes',
        'description' => 'Select nodes that users are allowed to deploy servers on.',
        'save_button' => 'Save Allowed Nodes',
        'save_success' => 'Allowed nodes updated successfully.',
        'save_error' => 'An error occurred while saving allowed nodes.',
    ],
    'server_creation' => [
        'node_not_allowed' => 'The selected node is not in the allowed list.',
        'no_nodes_available' => 'No allowed nodes are available in this location.',
        'invalid_node' => 'The selected node is invalid or does not exist.',
        'insufficient_allocations' => 'Insufficient port allocations. Please purchase more from the store.',
        'insufficient_backups' => 'Insufficient backup slots. Please purchase more from the store.',
        'insufficient_slots' => 'Insufficient server slots. Please purchase more from the store.',
    ],
];
