<?php

return [
    'daemon_connection_failed' => 'An exception occurred while attempting to communicate with the daemon resulting in a HTTP/:code response code. This exception has been logged.',
    'node' => [
        'servers_attached' => 'A node must have no servers associated with it in order to be deleted.',
        'daemon_off_config_updated' => 'The daemon configuration has been updated, but an error was encountered while attempting to automatically update the configuration file on the daemon. You will need to manually update the configuration file (config.yml) for the daemon to apply these changes.',
    ],
    'allocations' => [
        'server_using' => 'A server is currently assigned to this allocation. An allocation can only be deleted if no server is currently assigned.',
        'too_many_ports' => 'Adding more than 1000 ports in a single range at once is not supported.',
        'invalid_mapping' => 'The mapping provided for :port was invalid and could not be processed.',
        'cidr_out_of_range' => 'CIDR notation only allows masks between /25 and /32.',
        'port_out_of_range' => 'Ports in an allocation must be greater than 1024 and less than or equal to 65535.',
    ],
    'nest' => [
        'delete_has_servers' => 'A nest with active servers attached to it cannot be deleted from the Panel.',
        'egg' => [
            'delete_has_servers' => 'An egg with active servers attached to it cannot be deleted from the Panel.',
            'invalid_copy_id' => 'The egg selected for copying a script from either does not exist, or is copying a script itself.',
            'must_be_child' => 'The "Copy Settings From" directive for this egg must be a child option for the selected nest.',
            'has_children' => 'This egg is a parent to one or more other eggs. Please delete those eggs before deleting this egg.',
        ],
        'variables' => [
            'env_not_unique' => 'The environment variable :name must be unique to this egg.',
            'reserved_name' => 'The environment variable :name is protected and cannot be assigned to a variable.',
            'bad_validation_rule' => 'The validation rule ":rule" is not a valid rule for this application.',
        ],
        'importer' => [
            'json_error' => 'There was an error while attempting to parse the JSON file: :error.',
            'file_error' => 'The JSON file provided was not valid.',
            'invalid_json_provided' => 'The JSON file provided is not in a format that can be recognized.',
        ],
    ],
    'subusers' => [
        'editing_self' => 'Editing your own subuser account is not allowed.',
        'user_is_owner' => 'You cannot add the server owner as a subuser for this server.',
        'subuser_exists' => 'A user with that email address is already assigned as a subuser for this server.',
    ],
    'databases' => [
        'delete_has_databases' => 'Cannot delete a database host server that has active databases linked to it.',
    ],
    'tasks' => [
        'chain_interval_too_long' => 'The maximum interval time for a chained task is 15 minutes.',
    ],
    'locations' => [
        'has_nodes' => 'Cannot delete a location that has active nodes attached to it.',
    ],
    'users' => [
        'node_revocation_failed' => 'Failed to revoke keys on <a href=":link">Node #:node</a>. :error',
    ],
    'deployment' => [
        'no_viable_nodes' => 'No nodes satisfying the requirements specified for automatic deployment could be found.',
        'no_viable_allocations' => 'No allocations satisfying the requirements specified for automatic deployment could be found.',
    ],
    'api' => [
        'resource_not_found' => 'The requested resource does not exist on this server.',
    ],
];
