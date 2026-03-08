@extends('layouts.admin')

@section('title')
    @lang('admin/logs.title')
@endsection

@section('content-header')
    <h1>@lang('admin/logs.title') <small>@lang('admin/logs.description')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/logs.breadcrumb_admin')</a></li>
        <li class="active">@lang('admin/logs.title')</li>
    </ol>
@endsection

@section('content')
@php
    if (!class_exists('BetterPterodactyl\Logs\DB')) {
        require_once base_path('resources/settings/logs/helpers.php');
    }
    $logs = \BetterPterodactyl\Logs\DB::getLogs();
    $selectedLog = request()->query('file', (count($logs) > 0 ? $logs[0]['name'] : 'laravel.log'));
    $content = \BetterPterodactyl\Logs\DB::getLogContent($selectedLog);
@endphp

<style>
    .log-list-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 8px;
        color: var(--bp-text-muted);
        transition: all 0.2s;
        text-decoration: none !important;
        border: 1px solid transparent;
    }
    .log-list-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: white;
        border-color: var(--bp-border);
    }
    .log-list-item.active {
        background: var(--bp-primary);
        color: white;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .log-list-item i {
        margin-right: 10px;
        font-size: 1.1rem;
    }
    .log-size {
        font-size: 0.75rem;
        opacity: 0.7;
        background: rgba(0, 0, 0, 0.2);
        padding: 2px 8px;
        border-radius: 4px;
    }
    .log-viewer-container {
        background: #0d1117;
        border-radius: 8px;
        border: 1px solid var(--bp-border);
        overflow: hidden;
    }
    #log-content {
        height: 75vh;
        margin: 0;
        overflow: auto;
        padding: 20px;
        font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;
        font-size: 12px;
        line-height: 1.6;
        color: #d1d5db;
        white-space: pre-wrap;
        word-break: break-all;
    }
    /* Custom Scrollbar */
    #log-content::-webkit-scrollbar { width: 8px; height: 8px; }
    #log-content::-webkit-scrollbar-track { background: transparent; }
    #log-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    #log-content::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
</style>

<div class="row">
    <div class="col-md-3">
        <div class="bp-card-v2">
            <div class="bp-card-v2-header">
                <div class="bp-card-v2-title">
                    <i class="fa fa-folder-open" style="color: var(--bp-primary);"></i> @lang('admin/logs.list_title')
                </div>
            </div>
            <div class="bp-card-v2-body" style="padding: 16px;">
                <div style="max-height: 75vh; overflow-y: auto; padding-right: 5px;">
                    @foreach($logs as $log)
                        <a href="{{ route('admin.logs', ['file' => $log['name']]) }}" class="log-list-item {{ $selectedLog === $log['name'] ? 'active' : '' }}">
                            <div style="display: flex; align-items: center; overflow: hidden;">
                                <i class="fa fa-file-text-o"></i>
                                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ $log['name'] }}</span>
                            </div>
                            <span class="log-size">{{ round($log['size'] / 1024, 1) }} KB</span>
                        </a>
                    @endforeach
                    @if(count($logs) === 0)
                        <div class="text-center text-muted" style="padding: 20px;">@lang('admin/logs.no_logs_found')</div>
                    @endif
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-9">
        <div class="bp-card-v2">
            <div class="bp-card-v2-header">
                <div class="bp-card-v2-title">
                    <i class="fa fa-terminal" style="color: #10b981;"></i> @lang('admin/logs.viewing'): <code style="background: rgba(16, 185, 129, 0.1); color: #34d399; border: none; padding: 2px 8px;">{{ $selectedLog }}</code>
                </div>
                <div class="pull-right">
                    <button type="button" class="btn btn-sm btn-default" style="background: rgba(255,255,255,0.05); border: 1px solid var(--bp-border); color: white;" onclick="location.reload();">
                        <i class="fa fa-refresh"></i> @lang('admin/logs.refresh')
                    </button>
                </div>
            </div>
            <div class="bp-card-v2-body" style="padding: 0;">
                <div class="log-viewer-container">
                    <pre id="log-content">{{ $content }}</pre>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const logPre = document.getElementById('log-content');
        if (logPre) {
            logPre.scrollTop = logPre.scrollHeight;
        }
    });
</script>
@endsection
