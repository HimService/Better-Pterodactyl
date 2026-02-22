@extends('layouts.admin')

@section('title')
    {{ $node->name }}: @lang('admin/node.view.servers_tab.title')
@endsection

@section('content-header')
    <h1>{{ $node->name }}<small>@lang('admin/node.view.servers_tab.header')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.nodes') }}">@lang('admin/index.common.nodes')</a></li>
        <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></li>
        <li class="active">@lang('admin/node.view.servers')</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li><a href="{{ route('admin.nodes.view', $node->id) }}">@lang('admin/node.view.overview')</a></li>
                <li><a href="{{ route('admin.nodes.view.settings', $node->id) }}">@lang('admin/node.view.settings')</a></li>
                <li><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">@lang('admin/node.view.configuration')</a></li>
                <li><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">@lang('admin/node.view.allocation')</a></li>
                <li class="active"><a href="{{ route('admin.nodes.view.servers', $node->id) }}">@lang('admin/node.view.servers')</a></li>
            </ul>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-sm-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">@lang('admin/node.view.servers_tab.server_list')</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>@lang('strings.id')</th>
                        <th>@lang('strings.server_name')</th>
                        <th>@lang('strings.owner')</th>
                        <th>@lang('strings.service')</th>
                    </tr>
                    @foreach($servers as $server)
                        <tr data-server="{{ $server->uuid }}">
                            <td><code>{{ $server->uuidShort }}</code></td>
                            <td><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></td>
                            <td><a href="{{ route('admin.users.view', $server->owner_id) }}">{{ $server->user->username }}</a></td>
                            <td>{{ $server->nest->name }} ({{ $server->egg->name }})</td>
                        </tr>
                    @endforeach
                </table>
                @if($servers->hasPages())
                    <div class="box-footer with-border">
                        <div class="col-md-12 text-center">{!! $servers->render() !!}</div>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection
