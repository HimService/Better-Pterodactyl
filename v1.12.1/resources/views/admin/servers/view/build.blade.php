@extends('layouts.admin')

@section('title')
    @lang('admin/server.tabs.about') — {{ $server->name }}: @lang('admin/server.tabs.build')
@endsection

@section('content-header')
    <h1>{{ $server->name }}<small>@lang('admin/server.build.header_help')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.servers') }}">@lang('admin/index.common.servers')</a></li>
        <li><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></li>
        <li class="active">@lang('admin/server.tabs.build')</li>
    </ol>
@endsection

@section('content')
@include('admin.servers.partials.navigation')
<div class="row">
    <form action="{{ route('admin.servers.view.build', $server->id) }}" method="POST">
        <div class="col-sm-5">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/server.build.resource_management')</h3>
                </div>
                <div class="box-body">
                <div class="form-group">
                        <label for="cpu" class="control-label">@lang('strings.cpu_limit')</label>
                        <div class="input-group">
                            <input type="text" name="cpu" class="form-control" value="{{ old('cpu', $server->cpu) }}"/>
                            <span class="input-group-addon">%</span>
                        </div>
                        <p class="text-muted small">@lang('admin/server.build.cpu_help')</p>
                    </div>
                    <div class="form-group">
                        <label for="threads" class="control-label">@lang('admin/server.new.cpu_pinning')</label>
                        <div>
                            <input type="text" name="threads" class="form-control" value="{{ old('threads', $server->threads) }}"/>
                        </div>
                        <p class="text-muted small">@lang('admin/server.build.threads_help')</p>
                    </div>
                    <div class="form-group">
                        <label for="memory" class="control-label">@lang('admin/server.new.memory')</label>
                        <div class="input-group">
                            <input type="text" name="memory" data-multiplicator="true" class="form-control" value="{{ old('memory', $server->memory) }}"/>
                            <span class="input-group-addon">MiB</span>
                        </div>
                        <p class="text-muted small">@lang('admin/server.build.memory_help')</p>
                    </div>
                    <div class="form-group">
                        <label for="swap" class="control-label">@lang('admin/server.build.swap')</label>
                        <div class="input-group">
                            <input type="text" name="swap" data-multiplicator="true" class="form-control" value="{{ old('swap', $server->swap) }}"/>
                            <span class="input-group-addon">MiB</span>
                        </div>
                        <p class="text-muted small">@lang('admin/server.build.swap_help')</p>
                    </div>
                    <div class="form-group">
                        <label for="cpu" class="control-label">@lang('strings.disk_space')</label>
                        <div class="input-group">
                            <input type="text" name="disk" class="form-control" value="{{ old('disk', $server->disk) }}"/>
                            <span class="input-group-addon">MiB</span>
                        </div>
                        <p class="text-muted small">@lang('admin/server.build.disk_help')</p>
                    </div>
                    <div class="form-group">
                        <label for="io" class="control-label">@lang('admin/server.new.block_io_weight')</label>
                        <div>
                            <input type="text" name="io" class="form-control" value="{{ old('io', $server->io) }}"/>
                        </div>
                        <p class="text-muted small">@lang('admin/server.build.io_help')</p>
                    </div>
                    <div class="form-group">
                        <label for="cpu" class="control-label">@lang('admin/server.new.oom_killer')</label>
                        <div>
                            <div class="radio radio-danger radio-inline">
                                <input type="radio" id="pOomKillerEnabled" value="0" name="oom_disabled" @if(!$server->oom_disabled)checked @endif>
                                <label for="pOomKillerEnabled">@lang('strings.enabled')</label>
                            </div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pOomKillerDisabled" value="1" name="oom_disabled" @if($server->oom_disabled)checked @endif>
                                <label for="pOomKillerDisabled">@lang('strings.disabled')</label>
                            </div>
                            <p class="text-muted small">@lang('admin/server.build.oom_killer_help')</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-7">
            <div class="row">
                <div class="col-xs-12">
                    <div class="box">
                        <div class="box-header with-border">
                             <h3 class="box-title">@lang('admin/server.build.feature_limits')</h3>
                        </div>
                        <div class="box-body">
                            <div class="row">
                                <div class="form-group col-xs-6">
                                     <label for="database_limit" class="control-label">@lang('admin/server.new.database_limit')</label>
                                    <div>
                                        <input type="text" name="database_limit" class="form-control" value="{{ old('database_limit', $server->database_limit) }}"/>
                                    </div>
                                     <p class="text-muted small">@lang('admin/server.new.database_limit_help')</p>
                                </div>
                                <div class="form-group col-xs-6">
                                     <label for="allocation_limit" class="control-label">@lang('admin/server.new.allocation_limit')</label>
                                    <div>
                                        <input type="text" name="allocation_limit" class="form-control" value="{{ old('allocation_limit', $server->allocation_limit) }}"/>
                                    </div>
                                     <p class="text-muted small">@lang('admin/server.new.allocation_limit_help')</p>
                                </div>
                                <div class="form-group col-xs-6">
                                     <label for="backup_limit" class="control-label">@lang('admin/server.new.backup_limit')</label>
                                    <div>
                                        <input type="text" name="backup_limit" class="form-control" value="{{ old('backup_limit', $server->backup_limit) }}"/>
                                    </div>
                                     <p class="text-muted small">@lang('admin/server.new.backup_limit_help')</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xs-12">
                    <div class="box">
                        <div class="box-header with-border">
                             <h3 class="box-title">@lang('admin/server.build.allocation_management')</h3>
                        </div>
                        <div class="box-body">
                            <div class="form-group">
                                 <label for="pAllocation" class="control-label">@lang('admin/server.build.game_port')</label>
                                <select id="pAllocation" name="allocation_id" class="form-control">
                                    @foreach ($assigned as $assignment)
                                        <option value="{{ $assignment->id }}"
                                            @if($assignment->id === $server->allocation_id)
                                                selected="selected"
                                            @endif
                                        >{{ $assignment->alias }}:{{ $assignment->port }}</option>
                                    @endforeach
                                </select>
                                 <p class="text-muted small">@lang('admin/server.build.game_port_help')</p>
                            </div>
                            <div class="form-group">
                                 <label for="pAddAllocations" class="control-label">@lang('admin/server.build.add_additional')</label>
                                <div>
                                    <select name="add_allocations[]" class="form-control" multiple id="pAddAllocations">
                                        @foreach ($unassigned as $assignment)
                                            <option value="{{ $assignment->id }}">{{ $assignment->alias }}:{{ $assignment->port }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                 <p class="text-muted small">@lang('admin/server.build.add_additional_help')</p>
                            </div>
                            <div class="form-group">
                                 <label for="pRemoveAllocations" class="control-label">@lang('admin/server.build.remove_additional')</label>
                                <div>
                                    <select name="remove_allocations[]" class="form-control" multiple id="pRemoveAllocations">
                                        @foreach ($assigned as $assignment)
                                            <option value="{{ $assignment->id }}">{{ $assignment->alias }}:{{ $assignment->port }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                 <p class="text-muted small">@lang('admin/server.build.remove_additional_help')</p>
                            </div>
                        </div>
                        <div class="box-footer">
                            {!! csrf_field() !!}
                             <button type="submit" class="btn btn-primary pull-right">@lang('admin/server.build.update_build')</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#pAddAllocations').select2();
    $('#pRemoveAllocations').select2();
    $('#pAllocation').select2();
    </script>
@endsection
