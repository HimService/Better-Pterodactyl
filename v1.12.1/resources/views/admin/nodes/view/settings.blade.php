@extends('layouts.admin')

@section('title')
    {{ $node->name }}: @lang('admin/node.view.settings_tab.title')
@endsection

@section('content-header')
    <h1>{{ $node->name }}<small>@lang('admin/node.view.settings_tab.header')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.nodes') }}">@lang('admin/index.common.nodes')</a></li>
        <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></li>
        <li class="active">@lang('admin/node.view.settings')</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li><a href="{{ route('admin.nodes.view', $node->id) }}">@lang('admin/node.view.overview')</a></li>
                <li class="active"><a href="{{ route('admin.nodes.view.settings', $node->id) }}">@lang('admin/node.view.settings')</a></li>
                <li><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">@lang('admin/node.view.configuration')</a></li>
                <li><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">@lang('admin/node.view.allocation')</a></li>
                <li><a href="{{ route('admin.nodes.view.servers', $node->id) }}">@lang('admin/node.view.servers')</a></li>
            </ul>
        </div>
    </div>
</div>
<form action="{{ route('admin.nodes.view.settings', $node->id) }}" method="POST">
    <div class="row">
        <div class="col-sm-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/node.view.settings')</h3>
                </div>
                <div class="box-body row">
                    <div class="form-group col-xs-12">
                        <label for="name" class="control-label">@lang('admin/node.view.settings_tab.node_name')</label>
                        <div>
                            <input type="text" autocomplete="off" name="name" class="form-control" value="{{ old('name', $node->name) }}" />
                            <p class="text-muted"><small>@lang('admin/node.new.name_help')</small></p>
                        </div>
                    </div>
                    <div class="form-group col-xs-12">
                        <label for="description" class="control-label">@lang('strings.description')</label>
                        <div>
                            <textarea name="description" id="description" rows="4" class="form-control">{{ $node->description }}</textarea>
                        </div>
                    </div>
                    <div class="form-group col-xs-12">
                        <label for="name" class="control-label">@lang('strings.location')</label>
                        <div>
                            <select name="location_id" class="form-control">
                                @foreach($locations as $location)
                                    <option value="{{ $location->id }}" {{ (((int) old('location_id', $node->location_id)) === $location->id) ? 'selected' : '' }}>{{ $location->long }} ({{ $location->short }})</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    <div class="form-group col-xs-12">
                        <label for="public" class="control-label">@lang('admin/node.view.settings_tab.allow_auto_allocation') <sup><a data-toggle="tooltip" data-placement="top" data-container="body" title="@lang('admin/node.view.settings_tab.allow_auto_allocation_help')">?</a></sup></label>
                        <div>
                            <input type="radio" name="public" value="1" {{ (old('public', $node->public)) ? 'checked' : '' }} id="public_1" checked> <label for="public_1" style="padding-left:5px;">@lang('strings.yes')</label><br />
                            <input type="radio" name="public" value="0" {{ (old('public', $node->public)) ? '' : 'checked' }} id="public_0"> <label for="public_0" style="padding-left:5px;">@lang('strings.no')</label>
                        </div>
                    </div>
                    <div class="form-group col-xs-12">
                        <label for="display_on_status_page" class="control-label">@lang('admin/node.new.display_on_status_page') <sup><a data-toggle="tooltip" data-placement="top" data-container="body" title="@lang('admin/node.new.display_on_status_page_help')">?</a></sup></label>
                        <div>
                            <input type="radio" name="display_on_status_page" value="1" {{ (old('display_on_status_page', $displayOnStatusPage ?? true) == 1) ? 'checked' : '' }} id="display_on_status_page_1"> <label for="display_on_status_page_1" style="padding-left:5px;">@lang('strings.yes')</label><br />
                            <input type="radio" name="display_on_status_page" value="0" {{ (old('display_on_status_page', $displayOnStatusPage ?? true) == 0) ? 'checked' : '' }} id="display_on_status_page_0"> <label for="display_on_status_page_0" style="padding-left:5px;">@lang('strings.no')</label>
                        </div>
                    </div>
                    <div class="form-group col-xs-12">
                        <label for="fqdn" class="control-label">@lang('admin/node.new.fqdn')</label>
                        <div>
                            <input type="text" autocomplete="off" name="fqdn" class="form-control" value="{{ old('fqdn', $node->fqdn) }}" />
                        </div>
                        <p class="text-muted"><small>@lang('admin/node.new.fqdn_help')
                                <a tabindex="0" data-toggle="popover" data-trigger="focus" title="@lang('admin/node.new.fqdn')?" data-content="@lang('admin/node.view.settings_tab.why_fqdn')">@lang('strings.why')?</a>
                            </small></p>
                    </div>
                    <div class="form-group col-xs-12">
                        <label class="form-label"><span class="label label-warning"><i class="fa fa-power-off"></i></span> @lang('admin/node.new.ssl')</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pSSLTrue" value="https" name="scheme" {{ (old('scheme', $node->scheme) === 'https') ? 'checked' : '' }}>
                                <label for="pSSLTrue"> @lang('admin/node.new.ssl_help_ssl')</label>
                            </div>
                            <div class="radio radio-danger radio-inline">
                                <input type="radio" id="pSSLFalse" value="http" name="scheme" {{ (old('scheme', $node->scheme) !== 'https') ? 'checked' : '' }}>
                                <label for="pSSLFalse"> @lang('admin/node.new.ssl_help_http')</label>
                            </div>
                        </div>
                        <p class="text-muted small">@lang('admin/node.new.ssl_help')</p>
                    </div>
                    <div class="form-group col-xs-12">
                        <label class="form-label"><span class="label label-warning"><i class="fa fa-power-off"></i></span> @lang('admin/node.new.behind_proxy')</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pProxyFalse" value="0" name="behind_proxy" {{ (old('behind_proxy', $node->behind_proxy) == false) ? 'checked' : '' }}>
                                <label for="pProxyFalse"> @lang('admin/node.new.not_behind_proxy') </label>
                            </div>
                            <div class="radio radio-info radio-inline">
                                <input type="radio" id="pProxyTrue" value="1" name="behind_proxy" {{ (old('behind_proxy', $node->behind_proxy) == true) ? 'checked' : '' }}>
                                <label for="pProxyTrue"> @lang('admin/node.new.behind_proxy') </label>
                            </div>
                        </div>
                        <p class="text-muted small">@lang('admin/node.new.behind_proxy_help')</p>
                    </div>
                    <div class="form-group col-xs-12">
                        <label class="form-label"><span class="label label-warning"><i class="fa fa-wrench"></i></span> @lang('admin/node.view.settings_tab.maintenance_mode')</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pMaintenanceFalse" value="0" name="maintenance_mode" {{ (old('maintenance_mode', $node->maintenance_mode) == false) ? 'checked' : '' }}>
                                <label for="pMaintenanceFalse"> @lang('strings.disabled')</label>
                            </div>
                            <div class="radio radio-warning radio-inline">
                                <input type="radio" id="pMaintenanceTrue" value="1" name="maintenance_mode" {{ (old('maintenance_mode', $node->maintenance_mode) == true) ? 'checked' : '' }}>
                                <label for="pMaintenanceTrue"> @lang('strings.enabled')</label>
                            </div>
                        </div>
                        <p class="text-muted small">@lang('admin/node.view.settings_tab.maintenance_mode_help')</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/node.view.settings_tab.allocation_limits')</h3>
                </div>
                <div class="box-body row">
                    <div class="col-xs-12">
                        <div class="row">
                            <div class="form-group col-xs-6">
                                <label for="memory" class="control-label">@lang('admin/node.new.total_memory')</label>
                                <div class="input-group">
                                    <input type="text" name="memory" class="form-control" data-multiplicator="true" value="{{ old('memory', $node->memory) }}"/>
                                    <span class="input-group-addon">MiB</span>
                                </div>
                            </div>
                            <div class="form-group col-xs-6">
                                <label for="memory_overallocate" class="control-label">@lang('admin/node.new.memory_overallocate')</label>
                                <div class="input-group">
                                    <input type="text" name="memory_overallocate" class="form-control" value="{{ old('memory_overallocate', $node->memory_overallocate) }}"/>
                                    <span class="input-group-addon">%</span>
                                </div>
                            </div>
                        </div>
                        <p class="text-muted small">@lang('admin/node.view.settings_tab.memory_help')</p>
                    </div>
                    <div class="col-xs-12">
                        <div class="row">
                            <div class="form-group col-xs-6">
                                <label for="disk" class="control-label">@lang('admin/node.new.total_disk')</label>
                                <div class="input-group">
                                    <input type="text" name="disk" class="form-control" data-multiplicator="true" value="{{ old('disk', $node->disk) }}"/>
                                    <span class="input-group-addon">MiB</span>
                                </div>
                            </div>
                            <div class="form-group col-xs-6">
                                <label for="disk_overallocate" class="control-label">@lang('admin/node.new.disk_overallocate')</label>
                                <div class="input-group">
                                    <input type="text" name="disk_overallocate" class="form-control" value="{{ old('disk_overallocate', $node->disk_overallocate) }}"/>
                                    <span class="input-group-addon">%</span>
                                </div>
                            </div>
                        </div>
                        <p class="text-muted small">@lang('admin/node.view.settings_tab.disk_help')</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/node.view.settings_tab.general_configuration')</h3>
                </div>
                <div class="box-body row">
                    <div class="form-group col-xs-12">
                        <label for="disk_overallocate" class="control-label">@lang('admin/node.view.settings_tab.max_web_upload_filesize')</label>
                        <div class="input-group">
                            <input type="text" name="upload_size" class="form-control" value="{{ old('upload_size', $node->upload_size) }}"/>
                            <span class="input-group-addon">MiB</span>
                        </div>
                        <p class="text-muted"><small>@lang('admin/node.view.settings_tab.max_web_upload_filesize_help')</small></p>
                    </div>
                    <div class="col-xs-12">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label for="daemonListen" class="control-label"><span class="label label-warning"><i class="fa fa-power-off"></i></span> @lang('admin/node.new.daemon_port')</label>
                                <div>
                                    <input type="text" name="daemonListen" class="form-control" value="{{ old('daemonListen', $node->daemonListen) }}"/>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label for="daemonSFTP" class="control-label"><span class="label label-warning"><i class="fa fa-power-off"></i></span> @lang('admin/node.new.daemon_sftp_port')</label>
                                <div>
                                    <input type="text" name="daemonSFTP" class="form-control" value="{{ old('daemonSFTP', $node->daemonSFTP) }}"/>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <p class="text-muted"><small>@lang('admin/node.new.daemon_port_help')</small></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/node.view.settings_tab.save_settings')</h3>
                </div>
                <div class="box-body row">
                    <div class="form-group col-sm-6">
                        <div>
                            <input type="checkbox" name="reset_secret" id="reset_secret" /> <label for="reset_secret" class="control-label">@lang('admin/node.view.settings_tab.reset_secret')</label>
                        </div>
                        <p class="text-muted"><small>@lang('admin/node.view.settings_tab.reset_secret_help')</small></p>
                    </div>
                </div>
                <div class="box-footer">
                    {!! method_field('PATCH') !!}
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary pull-right">@lang('strings.save_changes')</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('footer-scripts')
    @parent
    <style>
        .tooltip-inner {
            max-width: none !important;
            white-space: nowrap !important;
            text-align: left;
        }
    </style>
    <script>
    $('[data-toggle="popover"]').popover({
        placement: 'auto'
    });
    $('select[name="location_id"]').select2();
    </script>
@endsection
