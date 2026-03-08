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
            @php
                if (!class_exists('BetterPterodactyl\Verification\DB')) {
                    require_once base_path('resources/settings/verification/helpers.php');
                }
                $verificationSettings = \BetterPterodactyl\Verification\DB::getSettings();
            @endphp
            <script>
                window.SiteConfiguration = window.SiteConfiguration || {};
                window.SiteConfiguration.recaptcha = {
                    enabled: {{ $verificationSettings['enabled'] ? 'true' : 'false' }},
                    siteKey: '{{ $verificationSettings['recaptcha_site_key'] }}',
                    verification_type: '{{ $verificationSettings['verification_type'] }}',
                    turnstile_site_key: '{{ $verificationSettings['turnstile_site_key'] }}' || '1x00000000000000000000AA',
                };
            </script>
            <script>
                window.SiteLocale = '{{ app()->getLocale() }}';
            </script>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
            <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
            <script>
                window.swal = window.Swal;
            </script>
@show

        @yield('assets')

        @include('layouts.scripts')
    </head>
    <body class="{{ $css['body'] ?? '' }}">
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
