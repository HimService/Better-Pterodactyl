<!DOCTYPE html>
<html>
    <head>
        <title>{{ config('app.name', 'Pterodactyl') }}</title>

        @section('meta')
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
            <meta name="csrf-token" content="{{ csrf_token() }}">
            <meta name="robots" content="noindex">
            <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
            <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32">
            <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16">
            <link rel="manifest" href="/favicons/manifest.json">
            <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#bc6e3c">
            <link rel="shortcut icon" href="/favicons/favicon.ico">
            <meta name="msapplication-config" content="/favicons/browserconfig.xml">
            <meta name="theme-color" content="#0e4688">
        @show

        @section('user-data')
            @if(!is_null(Auth::user()))
                <script>
                    window.PterodactylUser = {!! json_encode(Auth::user()->toVueObject()) !!};
                </script>
            @endif
            @if(!empty($siteConfiguration))
                <script>
                    window.SiteConfiguration = {!! json_encode($siteConfiguration) !!};
                </script>
            @endif
        @show
        <style>
            @import url('//fonts.googleapis.com/css?family=Rubik:300,400,500&display=swap');
            @import url('//fonts.googleapis.com/css?family=IBM+Plex+Mono|IBM+Plex+Sans:500&display=swap');
            
            /* --- THEME VARIABLES --- */
            :root {
                --color-background-light: #f8f9fa;
                --color-text-light: #495057;
                --color-heading-light: #212529;
                --color-primary-light: #5e72e4;
                --color-primary-hover-light: #4a5cc0;
                --color-sidebar-bg-light: #ffffff;
                --color-sidebar-text-light: #525f7f;
                --color-sidebar-active-bg-light: #f6f9fc;
                --color-sidebar-active-text-light: #5e72e4;
                --color-header-bg-light: #f8f9fa;
                --color-card-bg-light: #ffffff;
                --color-card-border-light: #e9ecef;
                --color-shadow-light: rgba(0, 0, 0, 0.05);
                --color-text-muted-light: #6c757d;
                --color-danger-bg-light: #f8d7da;
                --color-danger-text-light: #721c24;
                --color-danger-light: #dc3545;
                --color-neutral-bg-light: #e9ecef;
                --color-neutral-text-light: #495057;
                --color-icon-light: #6c757d;

                --color-background-dark: #171923;
                --color-text-dark: #a0aec0;
                --color-heading-dark: #e2e8f0;
                --color-primary-dark: #7f5af0;
                --color-primary-hover-dark: #6a48d0;
                --color-sidebar-bg-dark: #1a202c;
                --color-sidebar-text-dark: #a0aec0;
                --color-sidebar-active-bg-dark: #2d3748;
                --color-sidebar-active-text-dark: #7f5af0;
                --color-header-bg-dark: #171923;
                --color-card-bg-dark: #1a202c;
                --color-card-border-dark: #4a5568;
                --color-shadow-dark: rgba(0, 0, 0, 0.2);
                --color-text-muted-dark: #718096;
                --color-danger-bg-dark: #4a2a2a;
                --color-danger-text-dark: #feb2b2;
                --color-danger-dark: #f56565;
                --color-neutral-bg-dark: #2d3748;
                --color-neutral-text-dark: #e2e8f0;
                --color-icon-dark: #a0aec0;
            }

            /* --- THEME ASSIGNMENT --- */
            body[data-theme="light"] {
                --color-background: var(--color-background-light);
                --color-text: var(--color-text-light);
                --color-heading: var(--color-heading-light);
                --color-primary: var(--color-primary-light);
                --color-primary-hover: var(--color-primary-hover-light);
                --color-sidebar-bg: var(--color-sidebar-bg-light);
                --color-sidebar-text: var(--color-sidebar-text-light);
                --color-sidebar-active-bg: var(--color-sidebar-active-bg-light);
                --color-sidebar-active-text: var(--color-sidebar-active-text-light);
                --color-header-bg: var(--color-header-bg-light);
                --color-card-bg: var(--color-card-bg-light);
                --color-card-border: var(--color-card-border-light);
                --color-shadow: var(--color-shadow-light);
                --color-navigation-bg: var(--color-header-bg-light);
                --color-text-muted: var(--color-text-muted-light);
                --color-danger-bg: var(--color-danger-bg-light);
                --color-danger-text: var(--color-danger-text-light);
                --color-danger: var(--color-danger-light);
                --color-neutral-bg: var(--color-neutral-bg-light);
                --color-neutral-text: var(--color-neutral-text-light);
                --color-icon: var(--color-icon-light);
            }

            body[data-theme="dark"] {
                --color-background: var(--color-background-dark);
                --color-text: var(--color-text-dark);
                --color-heading: var(--color-heading-dark);
                --color-primary: var(--color-primary-dark);
                --color-primary-hover: var(--color-primary-hover-dark);
                --color-sidebar-bg: var(--color-sidebar-bg-dark);
                --color-sidebar-text: var(--color-sidebar-text-dark);
                --color-sidebar-active-bg: var(--color-sidebar-active-bg-dark);
                --color-sidebar-active-text: var(--color-sidebar-active-text-dark);
                --color-header-bg: var(--color-header-bg-dark);
                --color-card-bg: var(--color-card-bg-dark);
                --color-card-border: var(--color-card-border-dark);
                --color-shadow: var(--color-shadow-dark);
                --color-navigation-bg: var(--color-header-bg-dark);
                --color-text-muted: var(--color-text-muted-dark);
                --color-danger-bg: var(--color-danger-bg-dark);
                --color-danger-text: var(--color-danger-text-dark);
                --color-danger: var(--color-danger-dark);
                --color-neutral-bg: var(--color-neutral-bg-dark);
                --color-neutral-text: var(--color-neutral-text-dark);
                --color-icon: var(--color-icon-dark);
            }
            
            body {
                background-color: var(--color-background);
                color: var(--color-text);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
            }

            .grey-row-box {
                background-color: var(--color-card-bg);
                border: 1px solid var(--color-card-border);
                box-shadow: 0 4px 6px -1px var(--color-shadow), 0 2px 4px -1px var(--color-shadow);
                color: var(--color-text);
                transition: all 0.2s ease-in-out;
            }

            .grey-row-box:hover {
                border-color: var(--color-primary);
            }
        </style>

        @yield('assets')

        @include('layouts.scripts')
    </head>
    <body data-theme="light">
        @section('content')
            @yield('above-container')
            @yield('container')
            @yield('below-container')
        @show
        @section('scripts')
            {!! $asset->js('main.js') !!}
        @show
    </body>
</html>
