<?php

return [
    'notices' => [
        'host_created' => 'A new database host has been successfully created.',
        'host_updated' => 'Database host has been successfully updated.',
        'host_deleted' => 'Database host has been successfully deleted.',
        'linked_nodes_updated' => 'The linked nodes for this database host have been updated.',
    ],
    'index' => [
        'title' => 'Database Hosts',
        'description' => 'The database hosts that servers can use to create databases.',
        'list' => 'Host List',
        'create_new' => 'Create New Host',
        'create_host' => 'Create New Database Host',
        'name_help' => 'A short identifier used to distinguish this host from others. Must be between 1 and 60 characters, e.g., <code>us.nyc.lvl3</code>.',
        'host_help' => 'The IP address or FQDN that should be used when the panel attempts to connect to this MySQL host to create new databases.',
        'port_help' => 'The port that MySQL is running on for this host.',
        'username_help' => 'The username of the account with enough permissions to create new users and databases on the system.',
        'password_help' => 'The password for the account defined.',
        'linked_node' => 'Linked Node',
        'node_help' => 'This setting does nothing other than default to this database host when adding a database to a server on the selected node.',
        'grant_help' => 'The account defined for this database host <strong>must</strong> have the <code>WITH GRANT OPTION</code> permission. If the account defined does not have this permission, requests to create databases <em>will</em> fail. <strong>Do not use the MySQL account details defined for this panel here.</strong>',
    ],
    'view' => [
        'header' => 'View databases and details associated with this database host.',
        'host_details' => 'Host Details',
        'user_details' => 'User Details',
        'databases' => 'Databases',
        'max_connections' => 'Max Connections',
        'connections_from' => 'Connections From',
        'unlimited' => 'Unlimited',
        'manage' => 'Manage',
    ],
];
