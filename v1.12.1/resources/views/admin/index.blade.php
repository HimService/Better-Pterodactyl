@extends('layouts.admin')

@section('title')
    @lang('admin/index.common.administration')
@endsection

@section('content-header')
    <h1>@lang('admin/index.title')<small>@lang('admin/index.subtitle')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li class="active">@lang('admin/index.index')</li>
    </ol>
@endsection

@section('content')
@php
    $nodes = \Pterodactyl\Models\Node::all();
    $serversCount = \Pterodactyl\Models\Server::count();
    $usersCount = \Pterodactyl\Models\User::count();
    $allocationsCount = \Pterodactyl\Models\Allocation::count();
    
    $totalMemory = $nodes->sum('memory');
    $totalDisk = $nodes->sum('disk');
    $usedMemory = \Pterodactyl\Models\Server::sum('memory');
    $usedDisk = \Pterodactyl\Models\Server::sum('disk');
    
    $memoryPercent = $totalMemory > 0 ? round(($usedMemory / $totalMemory) * 100) : 0;
    $diskPercent = $totalDisk > 0 ? round(($usedDisk / $totalDisk) * 100) : 0;
@endphp

<style>
    /* Better Pterodactyl Admin Styling */
    .bp-card {
        background-color: #1f2937; /* Tailwind Gray 800 */
        border-radius: 0.75rem;
        border: 1px solid #374151; /* Tailwind Gray 700 */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        color: #e5e7eb; /* Tailwind Gray 200 */
        margin-bottom: 24px;
        overflow: hidden;
    }
    .bp-card-header {
        border-bottom: 1px solid #374151;
        padding: 16px 24px;
        font-weight: 600;
        font-size: 1.125rem;
        color: #f9fafb; /* Tailwind Gray 50 */
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .bp-card-body {
        padding: 24px;
    }
    .bp-info-box {
        background-color: #1f2937;
        border-radius: 0.75rem;
        border: 1px solid #374151;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        color: #e5e7eb;
        display: flex;
        align-items: center;
        padding: 20px 24px;
        margin-bottom: 24px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .bp-info-box:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        border-color: #4b5563;
    }
    .bp-info-icon {
        width: 56px;
        height: 56px;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-right: 20px;
        flex-shrink: 0;
    }
    .bp-info-icon.primary { background-color: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .bp-info-icon.success { background-color: rgba(16, 185, 129, 0.15); color: #34d399; }
    .bp-info-icon.warning { background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    
    .bp-info-content {
        flex: 1;
        min-width: 0;
    }
    .bp-info-text {
        text-transform: uppercase;
        font-size: 0.75rem;
        font-weight: 700;
        color: #9ca3af; /* Tailwind Gray 400 */
        letter-spacing: 0.05em;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .bp-info-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: #f9fafb;
        line-height: 1;
        margin-bottom: 4px;
    }
    .bp-info-desc {
        font-size: 0.75rem;
        color: #6b7280; /* Tailwind Gray 500 */
    }
    
    /* Override progress bars */
    .bp-progress-wrapper {
        margin-bottom: 20px;
    }
    .bp-progress-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        color: #e5e7eb;
        margin-bottom: 8px;
        font-weight: 500;
    }
    .bp-progress {
        height: 8px;
        background-color: #374151;
        border-radius: 4px;
        overflow: hidden;
    }
    .bp-progress-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 1s ease-in-out;
    }
    .bp-progress-bar.primary { background-color: #3b82f6; } /* Blue 500 */
    .bp-progress-bar.info { background-color: #06b6d4; } /* Cyan 500 */
    
    /* Tables */
    .bp-table {
        width: 100%;
        color: #e5e7eb;
        border-collapse: collapse;
    }
    .bp-table th {
        border-bottom: 1px solid #374151 !important;
        text-transform: uppercase;
        font-size: 0.75rem;
        color: #9ca3af;
        padding: 12px 0 12px 8px;
        font-weight: 600;
        text-align: left;
    }
    .bp-table td {
        padding: 16px 8px;
        border-bottom: 1px solid #374151 !important;
        vertical-align: middle;
    }
    .bp-table tr:last-child td {
        border-bottom: none !important;
    }
    .bp-table a {
        color: #60a5fa;
        text-decoration: none;
        font-weight: 500;
        background: none !important;
    }
    .bp-table a:hover {
        color: #93c5fd;
        text-decoration: underline;
    }

    /* Badges */
    .bp-badge {
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.025em;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .bp-badge.success { background-color: rgba(16, 185, 129, 0.15); color: #34d399; }
    .bp-badge.danger { background-color: rgba(239, 68, 68, 0.15); color: #f87171; }
    .bp-badge.default { background-color: rgba(107, 114, 128, 0.15); color: #9ca3af; }
    
    /* Utility */
    .text-muted-custom { color: #9ca3af; }
</style>

<div class="row">
    <div class="col-xs-12">
        <div class="bp-card">
            <div class="bp-card-header" id="admin-greeting">
                <i class="fa fa-hand-spock-o text-muted-custom"></i> @lang('admin/index.welcome')
            </div>
            <div class="bp-card-body">
                <p style="font-size: 1.1rem; margin-bottom: 8px;">@lang('admin/index.welcome_desc1')</p>
                <p class="text-muted-custom">@lang('admin/index.welcome_desc2')</p>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <!-- Global Stats -->
    <div class="col-xs-12 col-md-4">
        <div class="bp-info-box">
            <div class="bp-info-icon primary"><i class="fa fa-server"></i></div>
            <div class="bp-info-content">
                <div class="bp-info-text">@lang('admin/index.total_servers')</div>
                <div class="bp-info-number">{{ $serversCount }}</div>
                <div class="bp-info-desc">@lang('admin/index.across_nodes', ['count' => $nodes->count()])</div>
            </div>
        </div>
    </div>
    
    <div class="col-xs-12 col-md-4">
        <div class="bp-info-box">
            <div class="bp-info-icon success"><i class="fa fa-users"></i></div>
            <div class="bp-info-content">
                <div class="bp-info-text">@lang('admin/index.total_users')</div>
                <div class="bp-info-number">{{ $usersCount }}</div>
                <div class="bp-info-desc">@lang('admin/index.active_accounts')</div>
            </div>
        </div>
    </div>
    
    <div class="col-xs-12 col-md-4">
        <div class="bp-info-box">
            <div class="bp-info-icon warning"><i class="fa fa-share-alt"></i></div>
            <div class="bp-info-content">
                <div class="bp-info-text">@lang('admin/index.total_allocations')</div>
                <div class="bp-info-number">{{ $allocationsCount }}</div>
                <div class="bp-info-desc">@lang('admin/index.allocated_ports')</div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <!-- Resource Usage -->
    <div class="col-xs-12 col-lg-6">
        <div class="bp-card">
            <div class="bp-card-header">
                <i class="fa fa-pie-chart text-muted-custom"></i> @lang('admin/index.global_resource_usage')
            </div>
            <div class="bp-card-body">
                <div class="bp-progress-wrapper">
                    <div class="bp-progress-labels">
                        <span>@lang('admin/index.memory_allocation')</span>
                        <span class="text-muted-custom">{{ $usedMemory }} MB / {{ $totalMemory }} MB</span>
                    </div>
                    <div class="bp-progress">
                        <div class="bp-progress-bar primary" style="width: {{ $memoryPercent }}%"></div>
                    </div>
                </div>
                
                <div class="bp-progress-wrapper" style="margin-bottom: 0;">
                    <div class="bp-progress-labels">
                        <span>@lang('admin/index.disk_space_allocation')</span>
                        <span class="text-muted-custom">{{ $usedDisk }} MB / {{ $totalDisk }} MB</span>
                    </div>
                    <div class="bp-progress">
                        <div class="bp-progress-bar info" style="width: {{ $diskPercent }}%"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Node Status -->
    <div class="col-xs-12 col-lg-6">
        <div class="bp-card">
            <div class="bp-card-header">
                <i class="fa fa-heartbeat text-muted-custom"></i> @lang('admin/index.node_heartbeat_hub')
            </div>
            <div class="bp-card-body" style="padding: 12px 24px;">
                <table class="bp-table">
                    <thead>
                        <tr>
                            <th>@lang('admin/index.node_name')</th>
                            <th>@lang('admin/index.status')</th>
                            <th>@lang('admin/index.location')</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($nodes as $node)
                        <tr>
                            <td><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></td>
                            <td class="node-status-badge" data-secret="{{ $node->getDecryptedKey() }}" data-location="{{ $node->scheme }}://{{ $node->fqdn }}:{{ $node->daemonListen }}/api/system">
                                <span class="bp-badge default"><i class="fa fa-refresh fa-spin"></i> @lang('admin/index.checking')</span>
                            </td>
                            <td class="text-muted-custom">{{ $node->location->short ?? __('admin/index.local') }}</td>
                        </tr>
                        @endforeach
                        @if($nodes->isEmpty())
                        <tr>
                            <td colspan="3" class="text-center text-muted-custom" style="padding: 24px;">@lang('admin/index.no_nodes')</td>
                        </tr>
                        @endif
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-xs-12 col-md-6">
        <div class="bp-card">
            <div class="bp-card-header">
                <i class="fa fa-info-circle text-muted-custom"></i> @lang('admin/index.system_information')
            </div>
            <div class="bp-card-body">
                @if ($version->isLatestPanel())
                    <p>@lang('admin/index.running_version') <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: #60a5fa; border: none;">{{ config('app.version') }}</code>.</p>
                    <p style="color: #34d399; font-weight: 500; margin-top: 8px;"><i class="fa fa-check-circle"></i> @lang('admin/index.panel_up_to_date')</p>
                @else
                    <p style="color: #f87171; font-weight: 500; margin-bottom: 8px;"><i class="fa fa-exclamation-triangle"></i> @lang('admin/index.panel_not_up_to_date')</p>
                    <p class="text-muted-custom">@lang('admin/index.latest_version') <a href="https://github.com/Pterodactyl/Panel/releases/v{{ $version->getPanel() }}" target="_blank" style="color: #60a5fa; text-decoration: underline;">{{ $version->getPanel() }}</a> @lang('admin/index.running_version_is') <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; border: none;">{{ config('app.version') }}</code>.</p>
                @endif
            </div>
        </div>
    </div>
    
    <div class="col-xs-12 col-md-6">
        <div class="bp-card">
            <div class="bp-card-header">
                <i class="fa fa-magic text-muted-custom"></i> @lang('admin/index.about_theme')
            </div>
            <div class="bp-card-body">
                <p>@lang('admin/index.about_theme_desc1')</p>
                <p class="text-muted-custom" style="margin-top: 8px;">@lang('admin/index.about_theme_desc2')</p>
            </div>
        </div>
    </div>
</div>

<div class="row" style="margin-bottom: 30px; display: flex; flex-wrap: wrap; gap: 16px; padding: 0 15px;">
    <a href="{{ $version->getDiscord() }}" style="flex: 1; min-width: 200px; padding: 12px; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 0.5rem; text-align: center; text-decoration: none; font-weight: 600; transition: all 0.2s;">
        <i class="fa fa-fw fa-support"></i> @lang('admin/index.get_help')
    </a>
    <a href="https://pterodactyl.io" style="flex: 1; min-width: 200px; padding: 12px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 0.5rem; text-align: center; text-decoration: none; font-weight: 600; transition: all 0.2s;">
        <i class="fa fa-fw fa-link"></i> @lang('admin/index.documentation')
    </a>
    <a href="https://github.com/pterodactyl/panel" style="flex: 1; min-width: 200px; padding: 12px; background: rgba(156, 163, 175, 0.15); color: #e5e7eb; border: 1px solid rgba(156, 163, 175, 0.3); border-radius: 0.5rem; text-align: center; text-decoration: none; font-weight: 600; transition: all 0.2s;">
        <i class="fa fa-fw fa-github"></i> @lang('admin/index.github')
    </a>
    <a href="{{ $version->getDonations() }}" style="flex: 1; min-width: 200px; padding: 12px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 0.5rem; text-align: center; text-decoration: none; font-weight: 600; transition: all 0.2s;">
        <i class="fa fa-fw fa-money"></i> @lang('admin/index.support')
    </a>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const greetingElement = document.getElementById('admin-greeting');
        if (greetingElement) {
            const hour = new Date().getHours();
            let greeting = @json(__('admin/index.greetings.good_evening'));
            if (hour >= 5 && hour < 12) {
                greeting = @json(__('admin/index.greetings.good_morning'));
            } else if (hour >= 12 && hour < 18) {
                greeting = @json(__('admin/index.greetings.good_afternoon'));
            }
            const adminStr = @json(__('admin/index.greetings.administrator'));
            greetingElement.innerHTML = `<i class="fa fa-hand-spock-o text-muted-custom" style="margin-right: 8px;"></i> ${greeting}, ${adminStr}!`;
        }

        // Check node status
        const nodes = document.querySelectorAll('.node-status-badge');
        nodes.forEach(function(node) {
            const location = node.getAttribute('data-location');
            const secret = node.getAttribute('data-secret');
            
            fetch(location, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + secret
                },
                mode: 'cors'
            })
            .then(response => {
                if (response.ok) {
                    node.innerHTML = '<span class="bp-badge success"><i class="fa fa-check"></i> ' + @json(__('admin/index.online')) + '</span>';
                } else {
                    node.innerHTML = '<span class="bp-badge danger"><i class="fa fa-times"></i> ' + @json(__('admin/index.offline')) + '</span>';
                }
            })
            .catch(error => {
                node.innerHTML = '<span class="bp-badge danger"><i class="fa fa-times"></i> ' + @json(__('admin/index.offline')) + '</span>';
            });
        });
    });
</script>
@endsection
