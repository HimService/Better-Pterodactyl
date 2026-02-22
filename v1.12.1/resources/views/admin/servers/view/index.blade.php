@extends('layouts.admin')

@section('title')
    @lang('admin/server.tabs.about') — {{ $server->name }}
@endsection

@section('content-header')
    <h1>{{ $server->name }}<small>{{ str_limit($server->description) }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.servers') }}">@lang('admin/index.common.servers')</a></li>
        <li class="active">{{ $server->name }}</li>
    </ol>
@endsection

@section('content')
@include('admin.servers.partials.navigation')
<div class="row">
    <div class="col-sm-8">
        <div class="row">
            <div class="col-xs-12">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">@lang('admin/server.view.information')</h3>
                    </div>
                    <div class="box-body table-responsive no-padding">
                        <table class="table table-hover">
                            <tr>
                                <td>@lang('admin/server.view.internal_id')</td>
                                <td><code>{{ $server->id }}</code></td>
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.external_id')</td>
                                @if(is_null($server->external_id))
                                    <td><span class="label label-default">@lang('admin/server.view.not_set')</span></td>
                                @else
                                    <td><code>{{ $server->external_id }}</code></td>
                                @endif
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.uuid')</td>
                                <td><code>{{ $server->uuid }}</code></td>
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.current_egg')</td>
                                <td>
                                    <a href="{{ route('admin.nests.view', $server->nest_id) }}">{{ $server->nest->name }}</a> ::
                                    <a href="{{ route('admin.nests.egg.view', $server->egg_id) }}">{{ $server->egg->name }}</a>
                                </td>
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.server_name')</td>
                                <td>{{ $server->name }}</td>
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.cpu_limit')</td>
                                <td>
                                    @if($server->cpu === 0)
                                        <code>@lang('admin/server.view.unlimited')</code>
                                    @else
                                        <code>{{ $server->cpu }}%</code>
                                    @endif
                                </td>
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.cpu_pinning')</td>
                                <td>
                                    @if($server->threads != null)
                                        <code>{{ $server->threads }}</code>
                                    @else
                                        <span class="label label-default">@lang('admin/server.view.not_set')</span>
                                    @endif
                                </td>
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.memory')</td>
                                <td>
                                    @if($server->memory === 0)
                                        <code>@lang('admin/server.view.unlimited')</code>
                                    @else
                                        <code>{{ $server->memory }}MiB</code>
                                    @endif
                                    /
                                    @if($server->swap === 0)
                                        <code data-toggle="tooltip" data-placement="top" title="@lang('admin/server.new.swap')">@lang('admin/server.view.not_set')</code>
                                    @elseif($server->swap === -1)
                                        <code data-toggle="tooltip" data-placement="top" title="@lang('admin/server.new.swap')">@lang('admin/server.view.unlimited')</code>
                                    @else
                                        <code data-toggle="tooltip" data-placement="top" title="@lang('admin/server.new.swap')"> {{ $server->swap }}MiB</code>
                                    @endif
                                </td>
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.disk_space')</td>
                                <td>
                                    @if($server->disk === 0)
                                        <code>@lang('admin/server.view.unlimited')</code>
                                    @else
                                        <code>{{ $server->disk }}MiB</code>
                                    @endif
                                </td>
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.block_io_weight')</td>
                                <td><code>{{ $server->io }}</code></td>
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.default_connection')</td>
                                <td><code>{{ $server->allocation->ip }}:{{ $server->allocation->port }}</code></td>
                            </tr>
                            <tr>
                                <td>@lang('admin/server.view.connection_alias')</td>
                                <td>
                                    @if($server->allocation->alias !== $server->allocation->ip)
                                        <code>{{ $server->allocation->alias }}:{{ $server->allocation->port }}</code>
                                    @else
                                        <span class="label label-default">@lang('admin/server.view.no_alias_assigned')</span>
                                    @endif
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-4">
        <div class="box box-primary">
            <div class="box-body" style="padding-bottom: 0px;">
                <div class="row">
                    @if($server->isSuspended())
                        <div class="col-sm-12">
                            <div class="small-box bg-yellow">
                                <div class="inner">
                                    <h3 class="no-margin">@lang('admin/server.view.suspended')</h3>
                                </div>
                            </div>
                        </div>
                    @endif
                    @if(!$server->isInstalled())
                        <div class="col-sm-12">
                            <div class="small-box {{ (! $server->isInstalled()) ? 'bg-blue' : 'bg-maroon' }}">
                                <div class="inner">
                                    <h3 class="no-margin">{{ (! $server->isInstalled()) ? trans('admin/server.view.installing') : trans('admin/server.view.install_failed') }}</h3>
                                </div>
                            </div>
                        </div>
                    @endif
                    <div class="col-sm-12">
                        <div class="small-box bg-gray">
                            <div class="inner">
                                <h3>{{ str_limit($server->user->username, 16) }}</h3>
                                <p>@lang('admin/server.view.owner')</p>
                            </div>
                            <div class="icon"><i class="fa fa-user"></i></div>
                            <a href="{{ route('admin.users.view', $server->user->id) }}" class="small-box-footer">
                                @lang('admin/server.view.more_info') <i class="fa fa-arrow-circle-right"></i>
                            </a>
                        </div>
                    </div>
                    <div class="col-sm-12">
                        <div class="small-box bg-gray">
                            <div class="inner">
                                <h3>{{ str_limit($server->node->name, 16) }}</h3>
                                <p>@lang('admin/server.view.node')</p>
                            </div>
                            <div class="icon"><i class="fa fa-codepen"></i></div>
                            <a href="{{ route('admin.nodes.view', $server->node->id) }}" class="small-box-footer">
                                @lang('admin/server.view.more_info') <i class="fa fa-arrow-circle-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
