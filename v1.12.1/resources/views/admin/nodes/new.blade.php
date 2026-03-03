@extends('layouts.admin')

@section('title')
    @lang('admin/index.common.nodes') &rarr; @lang('strings.new')
@endsection

@section('content-header')
    <h1>@lang('admin/node.new.header')<small>@lang('admin/node.new.header_help')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.nodes') }}">@lang('admin/index.common.nodes')</a></li>
        <li class="active">@lang('strings.new')</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.nodes.new') }}" method="POST">
    <div class="row">
        <div class="col-sm-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/node.new.basic_details')</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="pName" class="form-label">@lang('strings.name')</label>
                        <input type="text" name="name" id="pName" class="form-control" value="{{ old('name') }}"/>
                        <p class="text-muted small">@lang('admin/node.new.name_help')</p>
                    </div>
                    <div class="form-group">
                        <label for="pDescription" class="form-label">@lang('strings.description')</label>
                        <textarea name="description" id="pDescription" rows="4" class="form-control">{{ old('description') }}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="pLocationId" class="form-label">@lang('strings.location')</label>
                        <select name="location_id" id="pLocationId">
                            @foreach($locations as $location)
                                <option value="{{ $location->id }}" {{ $location->id != old('location_id') ?: 'selected' }}>{{ $location->short }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">@lang('admin/node.new.visibility')</label>
                        <div>
                            <div class="radio radio-success radio-inline">

                                <input type="radio" id="pPublicTrue" value="1" name="public" checked>
                                <label for="pPublicTrue"> @lang('admin/node.new.public') </label>
                            </div>
                            <div class="radio radio-danger radio-inline">
                                <input type="radio" id="pPublicFalse" value="0" name="public">
                                <label for="pPublicFalse"> @lang('admin/node.new.private') </label>
                            </div>
                        </div>
                        <p class="text-muted small">@lang('admin/node.new.visibility_help')</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">@lang('admin/node.new.display_on_status_page')</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pStatusPageTrue" value="1" name="display_on_status_page" {{ (old('display_on_status_page', $displayOnStatusPage ?? true) == 1) ? 'checked' : '' }}>
                                <label for="pStatusPageTrue"> @lang('strings.yes') </label>
                            </div>
                            <div class="radio radio-danger radio-inline">
                                <input type="radio" id="pStatusPageFalse" value="0" name="display_on_status_page" {{ (old('display_on_status_page', $displayOnStatusPage ?? true) == 0) ? 'checked' : '' }}>
                                <label for="pStatusPageFalse"> @lang('strings.no') </label>
                            </div>
                        </div>
                        <p class="text-muted small">@lang('admin/node.new.display_on_status_page_help')</p>
                    </div>
                    <div class="form-group">
                        <label for="pFQDN" class="form-label">@lang('admin/node.new.fqdn')</label>
                        <input type="text" name="fqdn" id="pFQDN" class="form-control" value="{{ old('fqdn') }}"/>
                        <p class="text-muted small">@lang('admin/node.new.fqdn_help')</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">@lang('admin/node.new.ssl')</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pSSLTrue" value="https" name="scheme" checked>
                                <label for="pSSLTrue"> @lang('admin/node.new.ssl_help_ssl')</label>
                            </div>
                            <div class="radio radio-danger radio-inline">
                                <input type="radio" id="pSSLFalse" value="http" name="scheme" @if(request()->isSecure()) disabled @endif>
                                <label for="pSSLFalse"> @lang('admin/node.new.ssl_help_http')</label>
                            </div>
                        </div>
                        @if(request()->isSecure())
                            <p class="text-danger small">@lang('admin/node.new.ssl_secure_error')</p>
                        @else
                            <p class="text-muted small">@lang('admin/node.new.ssl_help')</p>
                        @endif
                    </div>
                    <div class="form-group">
                        <label class="form-label">@lang('admin/node.new.behind_proxy')</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pProxyFalse" value="0" name="behind_proxy" checked>
                                <label for="pProxyFalse"> @lang('admin/node.new.not_behind_proxy') </label>
                            </div>
                            <div class="radio radio-info radio-inline">
                                <input type="radio" id="pProxyTrue" value="1" name="behind_proxy">
                                <label for="pProxyTrue"> @lang('admin/node.new.behind_proxy') </label>
                            </div>
                        </div>
                        <p class="text-muted small">@lang('admin/node.new.behind_proxy_help')</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/node.new.configuration')</h3>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label for="pDaemonBase" class="form-label">@lang('admin/node.new.daemon_base')</label>
                            <input type="text" name="daemonBase" id="pDaemonBase" class="form-control" value="/var/lib/pterodactyl/volumes" />
                            <p class="text-muted small">@lang('admin/node.new.daemon_base_help')</p>
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pMemory" class="form-label">@lang('admin/node.new.total_memory')</label>
                            <div class="input-group">
                                <input type="text" name="memory" data-multiplicator="true" class="form-control" id="pMemory" value="{{ old('memory') }}"/>
                                <span class="input-group-addon">MiB</span>
                            </div>
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pMemoryOverallocate" class="form-label">@lang('admin/node.new.memory_overallocate')</label>
                            <div class="input-group">
                                <input type="text" name="memory_overallocate" class="form-control" id="pMemoryOverallocate" value="{{ old('memory_overallocate') }}"/>
                                <span class="input-group-addon">%</span>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <p class="text-muted small">@lang('admin/node.new.memory_help')</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label for="pDisk" class="form-label">@lang('admin/node.new.total_disk')</label>
                            <div class="input-group">
                                <input type="text" name="disk" data-multiplicator="true" class="form-control" id="pDisk" value="{{ old('disk') }}"/>
                                <span class="input-group-addon">MiB</span>
                            </div>
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pDiskOverallocate" class="form-label">@lang('admin/node.new.disk_overallocate')</label>
                            <div class="input-group">
                                <input type="text" name="disk_overallocate" class="form-control" id="pDiskOverallocate" value="{{ old('disk_overallocate') }}"/>
                                <span class="input-group-addon">%</span>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <p class="text-muted small">@lang('admin/node.new.disk_help')</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label for="pDaemonListen" class="form-label">@lang('admin/node.new.daemon_port')</label>
                            <input type="text" name="daemonListen" class="form-control" id="pDaemonListen" value="8080" />
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pDaemonSFTP" class="form-label">@lang('admin/node.new.daemon_sftp_port')</label>
                            <input type="text" name="daemonSFTP" class="form-control" id="pDaemonSFTP" value="2022" />
                        </div>
                        <div class="col-md-12">
                            <p class="text-muted small">@lang('admin/node.new.daemon_port_help')</p>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-success pull-right">@lang('admin/node.new.create_node')</button>
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
        $('#pLocationId').select2();
    </script>
@endsection
