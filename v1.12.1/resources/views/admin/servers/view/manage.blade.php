@extends('layouts.admin')

@section('title')
    @lang('admin/server.tabs.about') — {{ $server->name }}: @lang('admin/server.tabs.manage')
@endsection

@section('content-header')
    <h1>{{ $server->name }}<small>@lang('admin/server.manage.header_help')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.servers') }}">@lang('admin/index.common.servers')</a></li>
        <li><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></li>
        <li class="active">@lang('admin/server.tabs.manage')</li>
    </ol>
@endsection

@section('content')
    @include('admin.servers.partials.navigation')
    <div class="row equal-height">
        <div class="col-sm-4">
            <div class="box box-danger">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/server.manage.reinstall')</h3>
                </div>
                <div class="box-body">
                    <p>{!! trans('admin/server.manage.reinstall_help') !!}</p>
                </div>
                <div class="box-footer">
                    @if($server->isInstalled())
                        <form action="{{ route('admin.servers.view.manage.reinstall', $server->id) }}" method="POST">
                            {!! csrf_field() !!}
                            <button type="submit" class="btn btn-danger">@lang('admin/server.manage.reinstall')</button>
                        </form>
                    @else
                        <button class="btn btn-danger disabled">@lang('admin/server.manage.reinstall_error')</button>
                    @endif
                </div>
            </div>
        </div>
        <div class="col-sm-4">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/server.manage.install_status')</h3>
                </div>
                <div class="box-body">
                    <p>@lang('admin/server.manage.install_status_help')</p>
                </div>
                <div class="box-footer">
                    <form action="{{ route('admin.servers.view.manage.toggle', $server->id) }}" method="POST">
                        {!! csrf_field() !!}
                        <button type="submit" class="btn btn-primary">@lang('admin/server.manage.toggle_install')</button>
                    </form>
                </div>
            </div>
        </div>

        @if(! $server->isSuspended())
            <div class="col-sm-4">
                <div class="box box-warning">
                    <div class="box-header with-border">
                        <h3 class="box-title">@lang('strings.suspend_server')</h3>
                    </div>
                    <div class="box-body">
                        <p>@lang('admin/server.manage.suspend_help')</p>
                    </div>
                    <div class="box-footer">
                        <form action="{{ route('admin.servers.view.manage.suspension', $server->id) }}" method="POST">
                            {!! csrf_field() !!}
                            <input type="hidden" name="action" value="suspend" />
                            <button type="submit" class="btn btn-warning @if(! is_null($server->transfer)) disabled @endif">@lang('strings.suspend_server')</button>
                        </form>
                    </div>
                </div>
            </div>
        @else
            <div class="col-sm-4">
                <div class="box box-success">
                    <div class="box-header with-border">
                        <h3 class="box-title">@lang('strings.unsuspend_server')</h3>
                    </div>
                    <div class="box-body">
                        <p>@lang('admin/server.manage.unsuspend_help')</p>
                    </div>
                    <div class="box-footer">
                        <form action="{{ route('admin.servers.view.manage.suspension', $server->id) }}" method="POST">
                            {!! csrf_field() !!}
                            <input type="hidden" name="action" value="unsuspend" />
                            <button type="submit" class="btn btn-success">@lang('strings.unsuspend_server')</button>
                        </form>
                    </div>
                </div>
            </div>
        @endif

        @if(is_null($server->transfer))
            <div class="col-sm-4">
                <div class="box box-success">
                    <div class="box-header with-border">
                        <h3 class="box-title">@lang('admin/server.tabs.transfer')</h3>
                    </div>
                    <div class="box-body">
                        <p>{!! trans('admin/server.manage.transfer_help') !!}</p>
                    </div>

                    <div class="box-footer">
                        @if($canTransfer)
                            <button class="btn btn-success" data-toggle="modal" data-target="#transferServerModal">@lang('admin/server.tabs.transfer')</button>
                        @else
                            <button class="btn btn-success disabled">@lang('admin/server.tabs.transfer')</button>
                            <p style="padding-top: 1rem;">@lang('admin/server.manage.transfer_nodes')</p>
                        @endif
                    </div>
                </div>
            </div>
        @else
            <div class="col-sm-4">
                <div class="box box-success">
                    <div class="box-header with-border">
                        <h3 class="box-title">@lang('admin/server.tabs.transfer')</h3>
                    </div>
                    <div class="box-body">
                        <p>{!! trans('admin/server.manage.transfer_in_progress', ['time' => $server->transfer->created_at]) !!}</p>
                    </div>

                    <div class="box-footer">
                        <button class="btn btn-success disabled">@lang('admin/server.tabs.transfer')</button>
                    </div>
                </div>
            </div>
        @endif
    </div>

    <div class="modal fade" id="transferServerModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <form action="{{ route('admin.servers.view.manage.transfer', $server->id) }}" method="POST">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title">@lang('admin/server.tabs.transfer')</h4>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <div class="form-group col-md-12">
                                <label for="pNodeId">@lang('strings.node')</label>
                                <select name="node_id" id="pNodeId" class="form-control">
                                    @foreach($locations as $location)
                                        <optgroup label="{{ $location->long }} ({{ $location->short }})">
                                            @foreach($location->nodes as $node)

                                                @if($node->id != $server->node_id)
                                                    <option value="{{ $node->id }}"
                                                            @if($location->id === old('location_id')) selected @endif
                                                    >{{ $node->name }}</option>
                                                @endif

                                            @endforeach
                                        </optgroup>
                                    @endforeach
                                </select>
                                <p class="small text-muted no-margin">@lang('admin/server.manage.transfer_node_help')</p>
                            </div>

                            <div class="form-group col-md-12">
                                <label for="pAllocation">@lang('admin/server.new.default_allocation')</label>
                                <select name="allocation_id" id="pAllocation" class="form-control"></select>
                                <p class="small text-muted no-margin">@lang('admin/server.manage.transfer_allocation_help')</p>
                            </div>

                            <div class="form-group col-md-12">
                                <label for="pAllocationAdditional">@lang('admin/server.new.additional_allocations')</label>
                                <select name="allocation_additional[]" id="pAllocationAdditional" class="form-control" multiple></select>
                                <p class="small text-muted no-margin">@lang('admin/server.manage.transfer_allocations_help')</p>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        {!! csrf_field() !!}
                        <button type="button" class="btn btn-default btn-sm pull-left" data-dismiss="modal">@lang('strings.cancel')</button>
                        <button type="submit" class="btn btn-success btn-sm">@lang('strings.confirm')</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    {!! Theme::js('vendor/lodash/lodash.js') !!}

    @if($canTransfer)
        {!! Theme::js('js/admin/server/transfer.js') !!}
    @endif
@endsection
