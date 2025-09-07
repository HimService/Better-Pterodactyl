<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>{{ config('app.name', 'Pterodactyl') }} - @yield('title')</title>
        <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
        <meta name="_token" content="{{ csrf_token() }}">

        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
        <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32">
        <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16">
        <link rel="manifest" href="/favicons/manifest.json">
        <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#bc6e3c">
        <link rel="shortcut icon" href="/favicons/favicon.ico">
        <meta name="msapplication-config" content="/favicons/browserconfig.xml">
        <meta name="theme-color" content="#0e4688">

        @include('layouts.scripts')

        @section('scripts')
            {!! Theme::css('vendor/select2/select2.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/bootstrap/bootstrap.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/adminlte/admin.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/sweetalert/sweetalert.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/animate/animate.min.css?t={cache-version}') !!}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/css/ionicons.min.css">

            <!--[if lt IE 9]>
            <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
            <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
            <![endif]-->
        @show
    </head>
    <body class="hold-transition fixed sidebar-mini" data-theme="light">
        <div class="wrapper">
            <header class="main-header">
                <a href="{{ route('index') }}" class="logo">
                    <span>{{ config('app.name', 'Pterodactyl') }}</span>
                </a>
                <nav class="navbar navbar-static-top">
                    <a href="#" class="sidebar-toggle" data-toggle="push-menu" role="button">
                        <span class="sr-only">切換導覽</span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </a>
                    <div class="navbar-custom-menu">
                        <ul class="nav navbar-nav">
                            <li class="user-menu">
                                <a href="{{ route('account') }}">
                                    <img src="https://www.gravatar.com/avatar/{{ md5(strtolower(Auth::user()->email)) }}?s=160" class="user-image" alt="User Image">
                                    <span class="hidden-xs">{{ Auth::user()->name_first }} {{ Auth::user()->name_last }}</span>
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('index') }}" data-toggle="tooltip" data-placement="bottom" title="離開管理控制"><i class="fa fa-server"></i></a>
                            </li>
                            <li>
                                <a href="#" id="theme-switcher" data-toggle="tooltip" data-placement="bottom" title="切換主題"><i class="fa fa-moon-o"></i></a>
                            </li>
                            <li>
                                <a href="{{ route('auth.logout') }}" id="logoutButton" data-toggle="tooltip" data-placement="bottom" title="登出"><i class="fa fa-sign-out"></i></a>
                            </li>
                        </ul>
                    </div>
                </nav>
            </header>
            <aside class="main-sidebar">
                <section class="sidebar">
                    <ul class="sidebar-menu">
                        <li class="header">基本管理</li>
                        <li class="{{ Route::currentRouteName() !== 'admin.index' ?: 'active' }}">
                            <a href="{{ route('admin.index') }}">
                                <i class="fa fa-home"></i> <span>總覽</span>
                            </a>
                        </li>
                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.settings') ?: 'active' }}">
                            <a href="{{ route('admin.settings')}}">
                                <i class="fa fa-wrench"></i> <span>設定</span>
                            </a>
                        </li>
                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.api') ?: 'active' }}">
                            <a href="{{ route('admin.api.index')}}">
                                <i class="fa fa-gamepad"></i> <span>控制面板 API</span>
                            </a>
                        </li>
                        <li class="header">管理</li>
                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.databases') ?: 'active' }}">
                            <a href="{{ route('admin.databases') }}">
                                <i class="fa fa-database"></i> <span>資料庫</span>
                            </a>
                        </li>
                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.locations') ?: 'active' }}">
                            <a href="{{ route('admin.locations') }}">
                                <i class="fa fa-globe"></i> <span>地點</span>
                            </a>
                        </li>
                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.nodes') ?: 'active' }}">
                            <a href="{{ route('admin.nodes') }}">
                                <i class="fa fa-sitemap"></i> <span>節點</span>
                            </a>
                        </li>
                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.servers') ?: 'active' }}">
                            <a href="{{ route('admin.servers') }}">
                                <i class="fa fa-server"></i> <span>伺服器</span>
                            </a>
                        </li>
                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.users') ?: 'active' }}">
                            <a href="{{ route('admin.users') }}">
                                <i class="fa fa-users"></i> <span>使用者</span>
                            </a>
                        </li>
                        <li class="header">服務管理</li>
                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.mounts') ?: 'active' }}">
                            <a href="{{ route('admin.mounts') }}">
                                <i class="fa fa-magic"></i> <span>掛載</span>
                            </a>
                        </li>
                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.nests') ?: 'active' }}">
                            <a href="{{ route('admin.nests') }}">
                                <i class="fa fa-th-large"></i> <span>核心區</span>
                            </a>
                        </li>
                    </ul>
                </section>
            </aside>
            <div class="content-wrapper">
                <section class="content-header">
                    @yield('content-header')
                </section>
                <section class="content">
                    <div class="row">
                        <div class="col-xs-12">
                            @if (count($errors) > 0)
                                <div class="alert alert-danger">
                                    驗證提供的資料時發生錯誤。<br><br>
                                    <ul>
                                        @foreach ($errors->all() as $error)
                                            <li>{{ $error }}</li>
                                        @endforeach
                                    </ul>
                                </div>
                            @endif
                            @foreach (Alert::getMessages() as $type => $messages)
                                @foreach ($messages as $message)
                                    <div class="alert alert-{{ $type }} alert-dismissable" role="alert">
                                        {!! $message !!}
                                    </div>
                                @endforeach
                            @endforeach
                        </div>
                    </div>
                    @yield('content')
                </section>
            </div>
            <footer class="main-footer">
                <div class="pull-right small text-gray" style="margin-right:10px;margin-top:-7px;">
                    <strong><i class="fa fa-fw {{ $appIsGit ? 'fa-git-square' : 'fa-code-fork' }}"></i></strong> {{ $appVersion }}<br />
                    <strong><i class="fa fa-fw fa-clock-o"></i></strong> {{ round(microtime(true) - LARAVEL_START, 3) }}s
                </div>
                Copyright &copy; 2015 - {{ date('Y') }} <a href="https://pterodactyl.io/">Pterodactyl Software</a>.
            </footer>
        </div>
        @section('footer-scripts')
            <script src="/js/keyboard.polyfill.js" type="application/javascript"></script>
            <script>keyboardeventKeyPolyfill.polyfill();</script>

            {!! Theme::js('vendor/jquery/jquery.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/sweetalert/sweetalert.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/bootstrap/bootstrap.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/slimscroll/jquery.slimscroll.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/adminlte/app.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/bootstrap-notify/bootstrap-notify.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/select2/select2.full.min.js?t={cache-version}') !!}
            {!! Theme::js('js/admin/functions.js?t={cache-version}') !!}
            <script src="/js/autocomplete.js" type="application/javascript"></script>

            @if(Auth::user()->root_admin)
                <script>
                    $('#logoutButton').on('click', function (event) {
                        event.preventDefault();

                        var that = this;
                        swal({
                            title: '您要登出嗎？',
                            type: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d9534f',
                            cancelButtonColor: '#d33',
                            confirmButtonText: '登出'
                        }, function () {
                             $.ajax({
                                type: 'POST',
                                url: '{{ route('auth.logout') }}',
                                data: {
                                    _token: '{{ csrf_token() }}'
                                },complete: function () {
                                    window.location.href = '{{route('auth.login')}}';
                                }
                        });
                    });
                });
                </script>
            @endif

            <script>
                $(function () {
                    $('[data-toggle="tooltip"]').tooltip();
                })
            </script>
        @show
        <style>
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
            }

            /* --- GENERAL STYLES --- */
            body, .content-wrapper, .main-footer, .hold-transition, .skin-blue, .fixed, .sidebar-mini {
                background-color: var(--color-background) !important;
                color: var(--color-text) !important;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
            }

            .content-wrapper, .main-footer {
                border: none !important;
            }

            h1, h2, h3, h4, h5, h6, .box-title {
                color: var(--color-heading) !important;
            }

            /* --- HEADER --- */
            .main-header .navbar, .main-header .logo {
                background-color: var(--color-header-bg) !important;
                border-bottom: 1px solid var(--color-card-border) !important;
                box-shadow: 0 1px 3px var(--color-shadow) !important;
            }
            .main-header .logo {
                color: var(--color-heading) !important;
            }
            .main-header .navbar .nav > li > a {
                color: var(--color-text) !important;
            }
            .main-header .navbar .nav > li > a:hover {
                background: var(--color-sidebar-active-bg);
            }
            .sidebar-toggle .icon-bar {
                background: var(--color-text);
            }

            /* --- SIDEBAR --- */
            .main-sidebar {
                background-color: var(--color-sidebar-bg) !important;
                border-right: 1px solid var(--color-card-border) !important;
                box-shadow: none !important;
            }
            .sidebar-menu > li.header {
                background: transparent !important;
                color: var(--color-text) !important;
                opacity: 0.7;
                text-transform: uppercase;
                font-size: 0.875rem;
                letter-spacing: 0.5px;
                font-weight: 700;
                padding: 20px 15px 10px 15px;
            }
            .sidebar-menu > li > a {
                color: var(--color-sidebar-text) !important;
                padding: 12px 15px;
                transition: all 0.2s ease-in-out;
                border-radius: 6px;
                margin: 4px 10px;
            }
            .sidebar-menu > li:hover > a {
                background: var(--color-sidebar-active-bg) !important;
                color: var(--color-sidebar-active-text) !important;
            }
            .sidebar-menu > li.active > a {
                background: var(--color-sidebar-active-bg) !important;
                color: var(--color-sidebar-active-text) !important;
                font-weight: 600;
            }

            /* --- CONTENT & CARDS --- */
            .box {
                background: var(--color-card-bg) !important;
                border: 1px solid var(--color-card-border) !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 6px -1px var(--color-shadow), 0 2px 4px -1px var(--color-shadow) !important;
                border-top: none !important;
                margin-bottom: 20px;
                transition: all 0.2s ease-in-out;
            }
            .box-header {
                background: transparent !important;
                border-bottom: 1px solid var(--color-card-border) !important;
                padding: 20px;
            }
            .box-body {
                padding: 20px;
            }
            .box-footer {
                background: transparent !important;
                border-top: 1px solid var(--color-card-border) !important;
                padding: 15px 20px;
            }

            /* --- BUTTONS --- */
            .btn {
                border-radius: 6px !important;
                padding: 8px 16px !important;
                font-weight: 600 !important;
                transition: all 0.2s ease-in-out !important;
                border: none !important;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            .btn-primary {
                background-color: var(--color-primary) !important;
                color: #fff !important;
            }
            .btn-primary:hover {
                background-color: var(--color-primary-hover) !important;
            }
            .btn-group .btn {
                border-radius: 0 !important;
            }
            .btn-group .btn:first-child {
                border-radius: 6px 0 0 6px !important;
            }
            .btn-group .btn:last-child {
                border-radius: 0 6px 6px 0 !important;
            }
            .btn-group .btn.active {
                background-color: var(--color-primary-hover) !important;
                box-shadow: inset 0 3px 5px rgba(0,0,0,.125);
            }

            /* --- FORMS --- */
            .form-control {
                background-color: var(--color-background) !important;
                color: var(--color-text) !important;
                border: 1px solid var(--color-card-border) !important;
                border-radius: 6px !important;
                padding: 10px 12px !important;
                transition: all 0.2s ease-in-out;
            }
            .form-control:focus {
                border-color: var(--color-primary) !important;
                box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
            }
            select.form-control {
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23868e96%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l128%20127.9c3.6%203.6%207.8%205.4%2013%205.4s9.4-1.8%2013-5.4L287%2095.2c3.6-3.6%205.4-7.8%205.4-13%200-5-1.8-9.4-5.4-13z%22%2F%3E%3C%2Fsvg%3E');
                background-repeat: no-repeat;
                background-position: right .75rem center;
                background-size: .65rem auto;
                padding-right: 2.5rem !important;
                height: calc(1.5em + 1.5rem + 2px);
            }
            body[data-theme="dark"] select.form-control {
                 background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0aec0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l128%20127.9c3.6%203.6%207.8%205.4%2013%205.4s9.4-1.8%2013-5.4L287%2095.2c3.6-3.6%205.4-7.8%205.4-13%200-5-1.8-9.4-5.4-13z%22%2F%3E%3C%2Fsvg%3E');
            }

            /* --- TABLES --- */
            .table {
                color: var(--color-text);
            }
            .table > thead > tr > th, .table > tbody > tr > td {
                border-top: 1px solid var(--color-card-border) !important;
            }
            .table > thead > tr > th {
                color: var(--color-heading);
                font-weight: 600;
            }
            .table-hover > tbody > tr:hover {
                background-color: var(--color-sidebar-active-bg) !important;
            }

            /* --- TABS --- */
            .nav-tabs-custom {
                background: transparent !important;
                box-shadow: none !important;
                margin-bottom: 20px;
            }
            .nav-tabs-custom > .nav-tabs {
                border-bottom-color: var(--color-card-border) !important;
            }
            .nav-tabs-custom > .nav-tabs > li > a {
                color: var(--color-text) !important;
                border-radius: 6px 6px 0 0 !important;
                border-bottom-width: 2px !important;
            }
            .nav-tabs-custom > .nav-tabs > li.active > a,
            .nav-tabs-custom > .nav-tabs > li.active:hover > a {
                background-color: transparent !important;
                color: var(--color-primary) !important;
                border-color: var(--color-card-border) var(--color-card-border) var(--color-primary) var(--color-card-border) !important;
            }
            .nav-tabs-custom > .nav-tabs > li:not(.active):hover > a {
                background-color: var(--color-sidebar-active-bg) !important;
                border-bottom-color: var(--color-card-border) !important;
            }
            .nav-tabs-custom > .tab-content {
                padding: 20px 0 0 0 !important;
            }

            /* --- SEARCH BOX FIX --- */
            .box-header {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: center;
            }
            .box-tools.search01 {
                flex-grow: 1;
                max-width: 400px; /* Adjust as needed */
                margin-top: 10px;
            }
            @media (min-width: 768px) {
                .box-tools.search01 {
                    margin-top: 0;
                    flex-grow: 0;
                    width: auto;
                }
            }

            /* --- SELECT2 WIDTH FIX --- */
            .select2-container {
                width: 100% !important;
            }

            /* --- CHECKBOX ALIGNMENT FIX --- */
            .checkbox {
                display: flex;
                align-items: center;
            }
            .checkbox label {
                margin-left: 10px;
            }

            /* --- FIX: INCREASE TEXT CONTRAST --- */
            body[data-theme="light"] .box-body p,
            body[data-theme="light"] .box-body .table td {
                color: #343a40;
            }
        </style>
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                const themeSwitcher = document.getElementById('theme-switcher');
                if (!themeSwitcher) return;

                const body = document.body;
                const themeIcon = themeSwitcher.querySelector('i');

                const applyTheme = (theme) => {
                    body.setAttribute('data-theme', theme);
                    localStorage.setItem('pterodactyl-theme', theme);
                    if (theme === 'dark') {
                        themeIcon.classList.remove('fa-moon-o');
                        themeIcon.classList.add('fa-sun-o');
                    } else {
                        themeIcon.classList.remove('fa-sun-o');
                        themeIcon.classList.add('fa-moon-o');
                    }
                };

                // Apply saved theme on page load
                const savedTheme = localStorage.getItem('pterodactyl-theme') || 'light';
                applyTheme(savedTheme);

                themeSwitcher.addEventListener('click', function (e) {
                    e.preventDefault();
                    const currentTheme = body.getAttribute('data-theme');
                    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                    applyTheme(newTheme);
                });
            });
        </script>
    </body>
</html>
