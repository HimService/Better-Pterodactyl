@extends('layouts.admin')

@section('title')
    {{ $node->name }}: @lang('admin/node.view.configuration_tab.title')
@endsection

@section('content-header')
    <h1>{{ $node->name }}<small>@lang('admin/node.view.configuration_tab.header')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.nodes') }}">@lang('admin/index.common.nodes')</a></li>
        <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></li>
        <li class="active">@lang('admin/node.view.configuration')</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li><a href="{{ route('admin.nodes.view', $node->id) }}">@lang('admin/node.view.overview')</a></li>
                <li><a href="{{ route('admin.nodes.view.settings', $node->id) }}">@lang('admin/node.view.settings')</a></li>
                <li class="active"><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">@lang('admin/node.view.configuration')</a></li>
                <li><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">@lang('admin/node.view.allocation')</a></li>
                <li><a href="{{ route('admin.nodes.view.servers', $node->id) }}">@lang('admin/node.view.servers')</a></li>
            </ul>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-sm-8">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">@lang('admin/node.view.configuration_tab.configuration_file')</h3>
            </div>
            <div class="box-body">
                <pre class="no-margin">{{ $node->getYamlConfiguration() }}</pre>
            </div>
            <div class="box-footer">
                <p class="no-margin">@lang('admin/node.view.configuration_tab.configuration_file_help')</p>
            </div>
        </div>
    </div>
    <div class="col-sm-4">
        <div class="box box-success">
            <div class="box-header with-border">
                <h3 class="box-title">@lang('admin/node.view.configuration_tab.auto_deploy')</h3>
            </div>
            <div class="box-body">
                    @lang('admin/node.view.configuration_tab.auto_deploy_help')
            </div>
            <div class="box-footer">
                <button type="button" id="configTokenBtn" class="btn btn-sm btn-default" style="width:100%;">@lang('admin/node.view.configuration_tab.generate_token')</button>
            </div>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#configTokenBtn').on('click', function (event) {
        $.ajax({
            method: 'POST',
            url: '{{ route('admin.nodes.view.configuration.token', $node->id) }}',
            headers: { 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
        }).done(function (data) {
            swal({
                title: '@lang('admin/node.view.configuration_tab.token_created')',
                text: '<p>@lang('admin/node.view.configuration_tab.auto_configure_command')<br /><small><pre>cd /etc/pterodactyl && sudo wings configure --panel-url {{ config('app.url') }} --token ' + data.token + ' --node ' + data.node + '{{ config('app.debug') ? ' --allow-insecure' : '' }}</pre></small></p>',
                html: true
            });
        }).fail(function () {
            swal({
                title: '@lang('strings.error')',
                text: '@lang('admin/node.view.configuration_tab.error_creating_token')',
                type: 'error'
            });
        });
    });
    </script>
@endsection
