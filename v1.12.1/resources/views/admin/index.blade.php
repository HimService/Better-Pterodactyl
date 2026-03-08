@extends('layouts.admin')

@php
    if (request()->isMethod('post') && request()->is('admin/announcements')) {
        try {
            $jsonPayload = request()->getContent();
            $decoded = json_decode($jsonPayload, true);
            if (!is_array($decoded)) {
                header('Content-Type: application/json', true, 400);
                echo json_encode(['error' => 'Invalid JSON payload. Expected an array.']);
                exit;
            }
            
            // Save the new array to the file
            file_put_contents(public_path('announcement.json'), $jsonPayload);

            header('Content-Type: application/json');
            echo json_encode(['success' => true]);
            exit;
        } catch (\Exception $e) {
            header('Content-Type: application/json', true, 500);
            echo json_encode(['error' => $e->getMessage()]);
            exit;
        }
    }

    // Load current announcement for the UI
    $announcementPath = public_path('announcement.json');
    $currentAnnouncement = file_exists($announcementPath) 
        ? json_decode(file_get_contents($announcementPath), true)
        : ['enabled' => false, 'type' => 'info', 'message' => '', 'link' => ''];
@endphp

@section('title')
    @lang('admin/index.common.administration')
@endsection

@section('content-header')
    <h1 style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <div>
            @if(Route::is('admin.announcements'))
                @lang('admin/index.announcements')
                <small>@lang('admin/index.announcements_help')</small>
            @elseif(Route::is('admin.status'))
                @lang('admin/index.status_settings')
                <small>@lang('admin/index.subtitle')</small>
            @elseif(Route::is('admin.economy'))
                @lang('admin/index.economy_settings')
                <small>@lang('admin/index.subtitle')</small>
            @elseif(Route::is('admin.trash'))
                @lang('admin/index.trash_settings')
                <small>@lang('admin/index.trash_help')</small>
            @elseif(Route::is('admin.logs'))
                @lang('admin/index.sidebar.logs')
                <small>@lang('admin/index.subtitle')</small>
            @else
                @lang('admin/index.title')
                <small>@lang('admin/index.subtitle')</small>
            @endif
        </div>
        @if(Route::is('admin.index'))
            <div class="bp-pro-greeting" id="admin-greeting">@lang('admin/index.welcome')</div>
        @endif
    </h1>
@endsection

@section('content')
@php
    // 1. Fetch Nodes using Eloquent (Source of truth)
    try {
        $nodes = \Pterodactyl\Models\Node::all();
    } catch (\Exception $e) {
        $nodes = collect(\DB::table('nodes')->get());
    }

    // 2. Main Dashboard Stats
    try {
        $serversCount = \Pterodactyl\Models\Server::count();
        $usersCount = \Pterodactyl\Models\User::count();
        $allocationsCount = \Pterodactyl\Models\Allocation::count();
        $usedAllocationsCount = \Pterodactyl\Models\Allocation::whereNotNull('server_id')->count();
        
        $totalMemory = $nodes->sum('memory');
        $totalDisk = $nodes->sum('disk');
        $usedMemory = \Pterodactyl\Models\Server::sum('memory');
        $usedDisk = \Pterodactyl\Models\Server::sum('disk');
        
        $memoryPercent = $totalMemory > 0 ? round(($usedMemory / $totalMemory) * 100) : 0;
        $diskPercent = $totalDisk > 0 ? round(($usedDisk / $totalDisk) * 100) : 0;
    } catch (\Exception $e) {
        $dashboardError = $e->getMessage();
    }

    // 3. Radar Specific Data
    $radarNodes = collect([]);
    $radarServers = collect([]);
    try {
        $radarNodes = $nodes->map(function($n) {
            $secret = '';
            try {
                if (is_object($n) && method_exists($n, 'getDecryptedKey')) {
                    $secret = $n->getDecryptedKey();
                } elseif (isset($n->daemon_token)) {
                    $secret = \Crypt::decrypt($n->daemon_token);
                }
            } catch (\Exception $e) {
                // Fallback to raw if decryption fails, though this shouldn't happen
                $secret = $n->daemon_token ?? '';
            }
            
            return [
                'id' => $n->id,
                'name' => $n->name,
                'is_maintenance' => (bool) ($n->maintenance_mode ?? $n->maintenance ?? false),
                'daemon_token' => $secret,
            ];
        });

        $radarServers = \Pterodactyl\Models\Server::with('node')
            ->orderBy('id', 'desc')
            ->limit(100)
            ->get()
            ->map(function($s) {
                return [
                    'id' => $s->id,
                    'uuid' => $s->uuid,
                    'name' => $s->name,
                    'node' => $s->node->name ?? 'Unknown',
                    'is_maintenance' => (bool) ($s->node->maintenance_mode ?? $s->node->maintenance ?? false),
                    'limits' => ['memory' => $s->memory],
                ];
            });
    } catch (\Exception $e) {
        $radarError = $e->getMessage();
    }
@endphp

<script>
    window.AdminRadarNodes = @json($radarNodes);
    window.AdminRadarServers = @json($radarServers);
    window.CurrentAnnouncement = @json($currentAnnouncement);
    @if(isset($dashboardError)) console.error('Better Pterodactyl: Dashboard Stats Error:', "{{ $dashboardError }}"); @endif
    @if(isset($radarError)) console.error('Better Pterodactyl: Radar Data Error:', "{{ $radarError }}"); @endif
</script>
<style>
    /* Better Pterodactyl Admin v2 Styling */
    :root {
        --bp-bg-card: #111827; /* Gray 900 */
        --bp-bg-card-alt: #1f2937; /* Gray 800 */
        --bp-border: rgba(255, 255, 255, 0.08); /* Gray 700ish */
        --bp-text: #f9fafb; /* Gray 50 */
        --bp-text-muted: #9ca3af; /* Gray 400 */
        --bp-primary: #6366f1; /* Brand Indigo 500 */
        --bp-white: #ffffff;
        --bp-accent: #818cf8; /* Indigo 400 */
        --bp-success: #10b981;
        --bp-danger: #ef4444;
        --bp-warning: #f59e0b;
    }

    .bp-row {
        display: flex;
        flex-wrap: wrap;
        margin: -12px;
    }
    .bp-col {
        padding: 12px;
        flex: 1;
    }
    .bp-col-12 { width: 100%; }
    .bp-col-8 { width: 66.66%; }
    .bp-col-4 { width: 33.33%; }
    .bp-col-3 { width: 25%; }

    .bp-card-v2 {
        background-color: var(--bp-bg-card);
        border: 1px solid var(--bp-border);
        border-radius: 1rem;
        color: var(--bp-text);
        margin-bottom: 24px;
        overflow: hidden;
        position: relative;
    }

    .bp-card-v2-header {
        padding: 20px 24px;
        border-bottom: 1px solid var(--bp-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .bp-card-v2-title {
        font-size: 1.25rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 12px;
        letter-spacing: -0.01em;
    }

    .bp-card-v2-body {
        padding: 32px;
    }

    /* Stats Blocks */
    .bp-stat-card {
        background-color: var(--bp-bg-card);
        border: 1px solid var(--bp-border);
        border-radius: 1.25rem;
        padding: 32px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        transition: all 0.2s;
        height: 140px; /* Fixed height for consistency */
    }
    .bp-stat-card:hover {
        border-color: rgba(255, 255, 255, 0.2);
        background-color: #161e2c;
    }
    .bp-stat-label {
        font-size: 0.95rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--bp-text-muted);
        letter-spacing: 0.08em;
    }
    .bp-stat-value {
        font-size: 2.75rem;
        font-weight: 800;
        color: white;
        line-height: 1.1;
    }
    .bp-stat-footer {
        font-size: 0.95rem;
        color: var(--bp-text-muted);
        display: flex;
        align-items: center;
        gap: 6px;
    }

    /* Node Grid - High Density */
    .node-pulse-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
        max-height: 600px;
        overflow-y: auto;
        padding-right: 8px;
    }
    .node-pulse-grid::-webkit-scrollbar { width: 4px; }
    .node-pulse-grid::-webkit-scrollbar-thumb { background: var(--bp-border); border-radius: 10px; }

    .node-pulse-card {
        background: #1f2937;
        border: 1px solid var(--bp-border);
        border-radius: 1rem;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: all 0.2s;
        text-decoration: none !important;
        position: relative;
    }
    .node-pulse-card:hover {
        border-color: #3b82f6;
        transform: translateY(-4px);
        background: #252f3f;
    }
    .node-pulse-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .node-pulse-status {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #4b5563; /* Default checking color */
    }
    .node-pulse-status.online { background-color: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.6); }
    .node-pulse-status.offline { background-color: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.6); }

    .node-pulse-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .node-pulse-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .node-pulse-info {
        font-size: 0.95rem;
        color: var(--bp-text-muted);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .node-pulse-fqdn {
        font-family: monospace;
        font-size: 0.9rem;
        color: #818cf8;
        background: rgba(99, 102, 241, 0.1);
        padding: 4px 10px;
        border-radius: 6px;
        width: fit-content;
    }

    /* Health Monitor */
    .health-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    .health-item {
        background: #131b2b;
        border: 1px solid var(--bp-border);
        border-radius: 0.75rem;
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .health-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;
        background: rgba(255,255,255,0.05);
        font-size: 14px;
    }
    .health-info {
        display: flex;
        flex-direction: column;
    }
    .health-label { font-size: 0.9rem; color: var(--bp-text-muted); }
    .health-status { font-size: 1rem; font-weight: 600; color: #10b981; }

    .action-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-top: 12px;
    }
    @media (max-width: 768px) {
        .action-grid { grid-template-columns: 1fr; }
    }
    .action-btn {
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--bp-border);
        border-radius: 0.75rem;
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        color: white;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.2s;
        text-decoration: none !important;
        text-align: center;
    }
    .action-btn:hover {
        background: rgba(255,255,255,0.08);
        border-color: var(--bp-primary);
        transform: translateY(-2px);
    }
    .action-icon {
        width: 48px;
        height: 48px;
        background: var(--bp-primary);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }

    /* Resource Usage */
    .bp-usage-bar {
        height: 10px;
        background: #1f2937;
        margin-top: 10px;
        border-radius: 5px;
    }
    .bp-usage-fill {
        height: 100%;
        border-radius: 5px;
        transition: width 0.5s;
    }

    /* Social Hub Hub */
    .bp-social-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }
    .bp-social-hub-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--bp-border);
        border-radius: 0.75rem;
        font-size: 1rem;
        font-weight: 600;
        color: var(--bp-text-muted);
        transition: all 0.2s;
        text-decoration: none !important;
    }
    .bp-social-hub-btn:hover {
        background: rgba(255,255,255,0.08);
        color: white;
        border-color: var(--bp-primary);
    }
    .bp-social-hub-btn i { font-size: 18px; width: 20px; text-align: center; }

    .bp-pro-greeting {
        font-size: 1.1rem;
        margin-left: 16px;
        color: var(--bp-primary);
        background: rgba(99, 102, 241, 0.1);
        padding: 6px 16px;
        border-radius: 99px;
        font-weight: 600;
    }

    @media (max-width: 992px) {
        .bp-col-8, .bp-col-4 { width: 100%; }
        .bp-col-3 { width: 50%; }
    }

    /* Social Buttons */
    .bp-social-row {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
    }
    .bp-social-btn {
        flex: 1;
        min-width: 180px;
        padding: 16px;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: white;
        font-weight: 600;
        text-decoration: none !important;
        transition: all 0.2s;
        border: 1px solid rgba(255,255,255,0.1);
        font-size: 0.9rem;
    }
    .bp-social-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        filter: brightness(1.1);
    }
    .bp-social-btn.discord { background: #f59e0b; }
    .bp-social-btn.docs { background: #2563eb; }
    .bp-social-btn.github { background: #1d4ed8; }
    .bp-social-btn.support { background: #10b981; }
    .bp-social-btn.project { background: #6366f1; }

    @media (max-width: 1200px) {
        .bp-social-btn { min-width: calc(33.33% - 16px); }
    }
    @media (max-width: 768px) {
        .bp-social-btn { min-width: calc(50% - 16px); }
    }
    @media (max-width: 480px) {
        .bp-social-btn { min-width: 100%; }
    }
</style>



<style>
    /* Force scrolling recovery for Admin Dashboard */
    html, body {
        overflow: auto !important;
    }
    .wrapper, .content-wrapper {
        overflow: visible !important;
    }
</style>
<script>
    // Inject server & node data for React Radar
    window.AdminRadarServers = {!! json_encode($radarServers ?? []) !!};
    window.AdminRadarNodes = {!! json_encode($radarNodes ?? []) !!};
    
    // Emergency Scroll & Layout Fix
    (function() {
        const recoverScroll = () => {
            document.body.classList.remove('fixed');
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            
            // Fix AdminLTE wrapper issues
            const wrappers = document.querySelectorAll('.wrapper, .content-wrapper');
            wrappers.forEach(el => {
                el.style.overflow = 'visible';
            });
        };
        
        recoverScroll();
        window.addEventListener('load', recoverScroll);
        // Periodic check to override any late-loading scripts
        const interval = setInterval(recoverScroll, 2000);
        setTimeout(() => clearInterval(interval), 10000);
    })();
</script>

<div id="admin-radar-root"></div>

@if(Route::is('admin.logs'))
    @include('admin.logs')
@endif

@if(Route::is('admin.index'))
<div class="row" style="margin-bottom: 24px;">
    <div class="col-xs-12 col-sm-6 col-md-3">
        <div class="bp-stat-card">
            <span class="bp-stat-label">@lang('admin/index.total_servers')</span>
            <span class="bp-stat-value">{{ $serversCount }}</span>
            <div class="bp-stat-footer"><i class="fa fa-hdd-o"></i> @lang('admin/index.across_nodes', ['count' => $nodes->count()])</div>
        </div>
    </div>
    <div class="col-xs-12 col-sm-6 col-md-3">
        <div class="bp-stat-card">
            <span class="bp-stat-label">@lang('admin/index.total_users')</span>
            <span class="bp-stat-value">{{ $usersCount }}</span>
            <div class="bp-stat-footer"><i class="fa fa-users"></i> @lang('admin/index.active_accounts')</div>
        </div>
    </div>
    <div class="col-xs-12 col-sm-6 col-md-3">
        <div class="bp-stat-card">
            <span class="bp-stat-label">@lang('admin/index.total_allocations')</span>
            <span class="bp-stat-value">{{ $usedAllocationsCount }} / {{ $allocationsCount }}</span>
            <div class="bp-stat-footer"><i class="fa fa-plug"></i> @lang('admin/index.allocated_ports')</div>
        </div>
    </div>
    <div class="col-xs-12 col-sm-6 col-md-3">
        <div class="bp-stat-card">
            <span class="bp-stat-label">@lang('admin/index.active_nodes')</span>
            <span class="bp-stat-value" id="active-nodes-count">0 / {{ $nodes->count() }}</span>
            <div class="bp-stat-footer"><i class="fa fa-heartbeat"></i> @lang('admin/index.checking')</div>
        </div>
    </div>
</div>
@endif

@if(Route::is('admin.index'))
<div class="row">
    <div class="col-md-8">
        <!-- Global Resource Usage -->
        <div class="bp-card-v2">
            <div class="bp-card-v2-header">
                <div class="bp-card-v2-title"><i class="fa fa-area-chart" style="color: #10b981;"></i> @lang('admin/index.global_resource_usage')</div>
            </div>
            <div class="bp-card-v2-body">
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <div style="font-size: 0.875rem; display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="display: flex; align-items: center; gap: 8px;"><i class="fa fa-microchip text-muted"></i> @lang('admin/index.memory_allocation')</span>
                            <span style="font-weight: 700;">{{ $memoryPercent }}%</span>
                        </div>
                        <div class="bp-usage-bar" style="height: 8px;">
                            <div class="bp-usage-fill" style="width:{{ $memoryPercent }}%; background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);"></div>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--bp-text-muted); margin-top: 8px; display: flex; justify-content: space-between;">
                            <span>{{ number_format($usedMemory / 1024, 1) }} GB Used</span>
                            <span>{{ number_format($totalMemory / 1024, 1) }} GB Total</span>
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="display: flex; align-items: center; gap: 8px;"><i class="fa fa-database text-muted"></i> @lang('admin/index.disk_space_allocation')</span>
                            <span style="font-weight: 700;">{{ $diskPercent }}%</span>
                        </div>
                        <div class="bp-usage-bar" style="height: 8px;">
                            <div class="bp-usage-fill" style="width:{{ $diskPercent }}%; background: linear-gradient(90deg, #10b981 0%, #34d399 100%);"></div>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--bp-text-muted); margin-top: 8px; display: flex; justify-content: space-between;">
                            <span>{{ number_format($usedDisk / 1024, 1) }} GB Used</span>
                            <span>{{ number_format($totalDisk / 1024, 1) }} GB Total</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Node Pulse Grid -->
        <div class="bp-card-v2">
            <div class="bp-card-v2-header">
                <div class="bp-card-v2-title"><i class="fa fa-th-large" style="color: #3b82f6;"></i> @lang('admin/index.node_heartbeat_hub')</div>
                <div class="text-muted" style="font-size: 0.8rem;">{{ $nodes->count() }} Nodes Total</div>
            </div>
            <div class="bp-card-v2-body">
                <!-- Heatmap Legend -->
                <div style="display: flex; gap: 12px; margin-bottom: 20px; font-size: 0.75rem; color: var(--bp-text-muted);">
                    <div style="display: flex; align-items: center; gap: 6px;"><div style="width: 8px; height: 8px; border-radius: 2px; background: #10b981;"></div> Safe (< 70%)</div>
                    <div style="display: flex; align-items: center; gap: 6px;"><div style="width: 8px; height: 8px; border-radius: 2px; background: #f59e0b;"></div> Warning (70-90%)</div>
                    <div style="display: flex; align-items: center; gap: 6px;"><div style="width: 8px; height: 8px; border-radius: 2px; background: #ef4444;"></div> Critical (> 90%)</div>
                </div>
                <div class="node-pulse-grid">
                    @foreach($nodes as $node)
                        @php
                            $nodeUsedMemory = app('db')->table('servers')->where('node_id', $node->id)->sum('memory');
                            $nodeUsedDisk = app('db')->table('servers')->where('node_id', $node->id)->sum('disk');
                            $nodeMemoryPercent = $node->memory > 0 ? ($nodeUsedMemory / $node->memory) * 100 : 0;
                            $nodeDiskPercent = $node->disk > 0 ? ($nodeUsedDisk / $node->disk) * 100 : 0;
                            $maxUsage = max($nodeMemoryPercent, $nodeDiskPercent);
                            $accentColor = '#10b981';
                            if ($maxUsage > 90) $accentColor = '#ef4444';
                            else if ($maxUsage > 70) $accentColor = '#f59e0b';
                        @endphp
                        <a href="{{ route('admin.nodes.view', $node->id) }}" class="node-pulse-card node-status-item" data-id="{{ $node->id }}" data-secret="{{ is_object($node) && method_exists($node, 'getDecryptedKey') ? $node->getDecryptedKey() : (is_array($node) ? ($node['daemon_token'] ?? '') : ($node->daemon_token ?? '')) }}" data-location="{{ $node->scheme ?? 'http' }}://{{ $node->fqdn ?? '127.0.0.1' }}:{{ $node->daemonListen ?? '8080' }}/api/system" style="background: #0d1117; border: 1px solid #30363d; border-radius: 12px; padding: 24px; transition: all 0.2s ease-in-out; display: block; text-decoration: none; position: relative; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);">
                            <!-- Subtle State Border Hover -->
                            <div class="state-accent" style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: {{ $nodeMemoryPercent > 90 ? '#f85149' : ($nodeMemoryPercent > 70 ? '#d29922' : '#238636') }}; opacity: 0.8;"></div>
                            
                            <div class="node-pulse-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
                                <div style="min-width: 0; padding-left: 8px;">
                                    <div class="node-pulse-name" style="font-size: 1.1rem; font-weight: 700; color: #f0f6fc; letter-spacing: -0.01em; margin-bottom: 4px;">{{ $node->name }}</div>
                                    <div style="font-size: 0.75rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #8b949e; opacity: 0.8;">{{ $node->fqdn }}</div>
                                </div>
                                <div class="node-pulse-status" id="node-status-{{ $node->id }}" style="width: 12px; height: 12px; border-radius: 50%; background: #21262d; border: 2px solid rgba(255,255,255,0.05); box-shadow: inset 0 0 4px rgba(0,0,0,0.5); transition: all 0.3s ease;"></div>
                            </div>
                            
                            <div class="node-pulse-body" style="display: flex; flex-direction: column; gap: 20px; padding-left: 8px;">
                                <!-- RAM Section -->
                                <div style="position: relative;">
                                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                                        <span style="font-size: 0.65rem; font-weight: 700; color: #8b949e; text-transform: uppercase; letter-spacing: 0.1em;">MEM</span>
                                        <span style="font-size: 0.95rem; font-weight: 700; font-family: ui-monospace, monospace; color: #f0f6fc;">{{ round($nodeMemoryPercent) }}<small style="font-size: 0.65rem; opacity: 0.6; margin-left: 2px;">%</small></span>
                                    </div>
                                    <div style="height: 4px; background: rgba(48, 54, 61, 0.4); border-radius: 2px; overflow: hidden;">
                                        <div style="height: 100%; width: {{ min($nodeMemoryPercent, 100) }}%; background: {{ $nodeMemoryPercent > 90 ? '#f85149' : ($nodeMemoryPercent > 70 ? '#d29922' : '#238636') }}; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);"></div>
                                    </div>
                                </div>

                                <!-- Disk Section -->
                                <div style="position: relative;">
                                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                                        <span style="font-size: 0.65rem; font-weight: 700; color: #8b949e; text-transform: uppercase; letter-spacing: 0.1em;">DISK</span>
                                        <span style="font-size: 0.95rem; font-weight: 700; font-family: ui-monospace, monospace; color: #f0f6fc;">{{ round($nodeDiskPercent) }}<small style="font-size: 0.65rem; opacity: 0.6; margin-left: 2px;">%</small></span>
                                    </div>
                                    <div style="height: 4px; background: rgba(48, 54, 61, 0.4); border-radius: 2px; overflow: hidden;">
                                        <div style="height: 100%; width: {{ min($nodeDiskPercent, 100) }}%; background: {{ $nodeDiskPercent > 90 ? '#f85149' : ($nodeDiskPercent > 70 ? '#d29922' : '#238636') }}; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <style>
                                .node-pulse-card:hover {
                                    border-color: #8b949e !important;
                                    background: #161b22 !important;
                                    transform: translateY(-4px);
                                    box-shadow: 0 10px 20px rgba(0,0,0,0.5) !important;
                                }
                                .node-pulse-card:hover .node-pulse-name {
                                    color: #58a6ff;
                                }
                                .node-pulse-status.online {
                                    background: #238636 !important;
                                    box-shadow: 0 0 15px rgba(35, 134, 54, 0.8), inset 0 0 5px rgba(255,255,255,0.2) !important;
                                    border: 2px solid rgba(255,255,255,0.1) !important;
                                }
                                .node-pulse-status.offline {
                                    background: #da3633 !important;
                                    box-shadow: 0 0 15px rgba(218, 54, 51, 0.8), inset 0 0 5px rgba(255,255,255,0.2) !important;
                                    border: 2px solid rgba(255,255,255,0.1) !important;
                                }
                            </style>
                        </a>
                    @endforeach
                    @if($nodes->isEmpty())
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; background: rgba(255,255,255,0.01); border-radius: 1rem; border: 2px dashed var(--bp-border);">
                            <div style="width: 64px; height: 64px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 20px;">
                                <i class="fa fa-server"></i>
                            </div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 700;">@lang('admin/index.no_nodes_found')</h3>
                            <p style="color: var(--bp-text-muted); max-width: 300px; margin-bottom: 24px;">@lang('admin/index.no_nodes_desc')</p>
                            <a href="{{ route('admin.nodes.new') }}" class="action-btn" style="background: #3b82f6; border: none; padding: 12px 32px;">
                                <i class="fa fa-plus"></i> @lang('admin/index.create_first_node')
                            </a>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <!-- Action Center -->
        <div class="bp-card-v2">
            <div class="bp-card-v2-header">
                <div class="bp-card-v2-title"><i class="fa fa-rocket" style="color: #ef4444;"></i> @lang('admin/index.action_center')</div>
            </div>
            <div class="bp-card-v2-body">
                <div class="action-grid">
                    <a href="{{ route('admin.servers.new') }}" class="action-btn">
                        <div class="action-icon" style="background: rgba(16, 185, 129, 0.2); color: #10b981;"><i class="fa fa-plus-circle"></i></div>
                        <span style="margin-top: 4px;">@lang('admin/index.new_server')</span>
                    </a>
                    <a href="{{ route('admin.users.new') }}" class="action-btn">
                        <div class="action-icon" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6;"><i class="fa fa-user-plus"></i></div>
                        <span style="margin-top: 4px;">@lang('admin/index.new_user')</span>
                    </a>
                    <a href="{{ route('admin.nodes.new') }}" class="action-btn">
                        <div class="action-icon" style="background: rgba(139, 92, 246, 0.2); color: #8b5cf6;"><i class="fa fa-cloud-upload"></i></div>
                        <span style="margin-top: 4px;">@lang('admin/index.new_node')</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Project & Support Hub (New Moved Here) -->
        <div class="bp-card-v2">
            <div class="bp-card-v2-header">
                <div class="bp-card-v2-title"><i class="fa fa-life-ring" style="color: #3b82f6;"></i> @lang('admin/index.get_help')</div>
            </div>
            <div class="bp-card-v2-body" style="padding: 16px 24px;">
                <div class="bp-social-grid">
                    <a href="https://discord.gg/pterodactyl" target="_blank" class="bp-social-hub-btn">
                        <i class="fa fa-comments" style="color: #7289da;"></i> Discord
                    </a>
                    <a href="https://pterodactyl.io" target="_blank" class="bp-social-hub-btn">
                        <i class="fa fa-book" style="color: #4ade80;"></i> Docs
                    </a>
                    <a href="https://github.com/pterodactyl/panel" target="_blank" class="bp-social-hub-btn">
                        <i class="fa fa-github" style="color: #f3f4f6;"></i> Github
                    </a>
                    <a href="https://pterodactyl.io/community/" target="_blank" class="bp-social-hub-btn">
                        <i class="fa fa-users" style="color: #f59e0b;"></i> Support
                    </a>
                </div>
                <a href="https://github.com/HimService/Better-Pterodactyl" target="_blank" class="bp-social-hub-btn" style="margin-top: 10px; background: linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(67, 56, 202, 0.1) 100%); border-color: rgba(99, 102, 241, 0.2); color: #818cf8;">
                    <i class="fa fa-rocket"></i> Better Pterodactyl Project
                </a>
            </div>
        </div>

    </div>
</div>

<div class="row">
    <div class="col-md-4">
        <!-- System Health -->
        <div class="bp-card-v2">
            <div class="bp-card-v2-header">
                <div class="bp-card-v2-title"><i class="fa fa-shield" style="color: #f59e0b;"></i> @lang('admin/index.system_health')</div>
            </div>
            <div class="bp-card-v2-body" style="padding: 16px 24px;">
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div class="health-item">
                        <div class="health-icon" style="color: #3b82f6; width: 32px; height: 32px; font-size: 14px;"><i class="fa fa-tasks"></i></div>
                        <div class="health-info">
                            <span class="health-label">@lang('admin/index.health_worker')</span>
                            <span class="health-status">Operational</span>
                        </div>
                    </div>
                    <div class="health-item">
                        <div class="health-icon" style="color: #10b981; width: 32px; height: 32px; font-size: 14px;"><i class="fa fa-database"></i></div>
                        <div class="health-info">
                            <span class="health-label">@lang('admin/index.health_db')</span>
                            <span class="health-status">Healthy</span>
                        </div>
                    </div>
                    <div class="health-item">
                        <div class="health-icon" style="color: #ef4444; width: 32px; height: 32px; font-size: 14px;"><i class="fa fa-bolt"></i></div>
                        <div class="health-info">
                            <span class="health-label">@lang('admin/index.health_redis')</span>
                            <span class="health-status">Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <!-- About Theme -->
        <div class="bp-card-v2" style="background: linear-gradient(135deg, #111827 0%, #1e1b4b 100%); border-color: rgba(99, 102, 241, 0.3);">
            <div class="bp-card-v2-header">
                <div class="bp-card-v2-title"><i class="fa fa-info-circle" style="color: #6366f1;"></i> @lang('admin/index.about_theme')</div>
            </div>
            <div class="bp-card-v2-body">
                <p style="font-size: 0.875rem; line-height: 1.6; color: var(--bp-text-muted); margin-bottom: 16px;">
                    @lang('admin/index.about_theme_desc1')
                </p>
                <div style="margin-top: 20px;">
                    <a href="https://github.com/HimService/Better-Pterodactyl" target="_blank" class="action-btn" style="background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2); padding: 12px;">
                        <i class="fa fa-github" style="color: #818cf8;"></i> View on GitHub
                    </a>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <!-- System Information -->
        <div class="bp-card-v2">
            <div class="bp-card-v2-header">
                <div class="bp-card-v2-title"><i class="fa fa-server" style="color: #10b981;"></i> @lang('admin/index.system_information')</div>
            </div>
            <div class="bp-card-v2-body">
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--bp-text-muted); margin-bottom: 4px;">@lang('admin/index.running_version')</div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-family: monospace; font-size: 1rem; font-weight: 700;">v{{ config('app.version') }}</span>
                            @if(isset($version) && $version->isLatestPanel())
                                <span class="label label-success" style="padding: 2px 8px; border-radius: 4px;">@lang('admin/index.panel_up_to_date')</span>
                            @endif
                        </div>
                    </div>
                    @if(isset($version) && !$version->isLatestPanel())
                        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 0.75rem; padding: 12px;">
                            <div style="font-size: 0.8rem; color: #f87171; font-weight: 600;">
                                <i class="fa fa-warning"></i> Upgrade Suggested: {{ $version->getPanel() }}
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endif

<script>
    document.addEventListener('DOMContentLoaded', function() {
        @if(Route::is('admin.index'))
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
            greetingElement.innerHTML = `${greeting}, ${adminStr}!`;
        }
        @endif

        // Check node status
        const nodes = document.querySelectorAll('.node-status-item');
        let onlineCount = 0;
        const totalCount = nodes.length;
        
        // Initialize AdminRadarNodeStatuses for React to consume
        window.AdminRadarNodeStatuses = {};

        nodes.forEach(function(node) {
            const location = node.getAttribute('data-location');
            const secret = node.getAttribute('data-secret');
            const id = node.getAttribute('data-id');
            const statusDot = document.getElementById('node-status-' + id);
            
            // Function to handle status updates
            const setStatus = (isOnline) => {
                if (isOnline) {
                    statusDot.classList.add('online');
                    statusDot.classList.remove('offline');
                    onlineCount++;
                } else {
                    statusDot.classList.add('offline');
                    statusDot.classList.remove('online');
                }
                window.AdminRadarNodeStatuses[id] = isOnline;
                updateTotalCount();
            };

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
                if (response.status === 403) {
                    console.error(`Better Pterodactyl: Node ${id} returned 403 Forbidden. This usually means the secret is invalid or Wings rejected the IP. Secret length: ${secret ? secret.length : 0}`);
                }
                setStatus(response.status === 200 || response.status === 204);
            })
            .catch(err => {
                console.error(`Better Pterodactyl: Error checking node ${id}:`, err);
                setStatus(false);
            });
        });

        function updateTotalCount() {
            const countDisplay = document.getElementById('active-nodes-count');
            if (countDisplay) {
                countDisplay.innerHTML = `${onlineCount} / ${totalCount}`;
            }
            // Trigger a custom event for React to listen to if it needs immediate updates
            window.dispatchEvent(new CustomEvent('radar:node-status-update', { 
                detail: { onlineCount, totalCount, statuses: window.AdminRadarNodeStatuses } 
            }));
        }
    });
</script>
@endsection
