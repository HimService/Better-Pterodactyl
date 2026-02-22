@extends('layouts.admin')

@section('title')
    @lang('admin/nests.index.title') &rarr; @lang('admin/nests.view.new_egg')
@endsection

@section('content-header')
    <h1>@lang('admin/nests.view.new_egg')<small>@lang('admin/nests.eggs.new_egg_description')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.nests') }}">@lang('admin/nests.index.title')</a></li>
        <li class="active">@lang('admin/nests.view.new_egg')</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.nests.egg.new') }}" method="POST">
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/nests.eggs.configuration')</h3>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pNestId" class="form-label">@lang('admin/nests.index.associated_nest')</label>
                                <div>
                                    <select name="nest_id" id="pNestId">
                                        @foreach($nests as $nest)
                                            <option value="{{ $nest->id }}" {{ old('nest_id') != $nest->id ?: 'selected' }}>{{ $nest->name }} &lt;{{ $nest->author }}&gt;</option>
                                        @endforeach
                                    </select>
                                    <p class="text-muted small">@lang('admin/nests.eggs.nest_help')</p>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="pName" class="form-label">@lang('strings.name')</label>
                                <input type="text" id="pName" name="name" value="{{ old('name') }}" class="form-control" />
                                <p class="text-muted small">@lang('admin/nests.eggs.name_help_new')</p>
                            </div>
                            <div class="form-group">
                                <label for="pDescription" class="form-label">@lang('strings.description')</label>
                                <textarea id="pDescription" name="description" class="form-control" rows="8">{{ old('description') }}</textarea>
                                <p class="text-muted small">@lang('admin/nests.eggs.description_help')</p>
                            </div>
                            <div class="form-group">
                                <div class="checkbox checkbox-primary no-margin-bottom">
                                    <input id="pForceOutgoingIp" name="force_outgoing_ip" type="checkbox" value="1" {{ \Pterodactyl\Helpers\Utilities::checked('force_outgoing_ip', 0) }} />
                                    <label for="pForceOutgoingIp" class="strong">@lang('admin/nests.eggs.force_outgoing_ip')</label>
                                    <p class="text-muted small">
                                        @lang('admin/nests.eggs.force_outgoing_ip_help')
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pDockerImage" class="control-label">@lang('admin/nests.eggs.docker_images')</label>
                                <textarea id="pDockerImages" name="docker_images" rows="4" placeholder="ghcr.io/pterodactyl/yolks" class="form-control">{{ old('docker_images') }}</textarea>
                                <p class="text-muted small">@lang('admin/nests.eggs.docker_images_help')</p>
                            </div>
                            <div class="form-group">
                                <label for="pStartup" class="control-label">@lang('admin/nests.eggs.startup_command')</label>
                                <textarea id="pStartup" name="startup" class="form-control" rows="10">{{ old('startup') }}</textarea>
                                <p class="text-muted small">@lang('admin/nests.eggs.startup_command_help')</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigFeatures" class="control-label">@lang('strings.features')</label>
                                <div>
                                    <select class="form-control" name="features[]" id="pConfigFeatures" multiple>
                                    </select>
                                    <p class="text-muted small">@lang('admin/nests.eggs.features_help')</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/nests.eggs.process_management')</h3>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="col-xs-12">
                            <div class="alert alert-warning">
                                <p>@lang('admin/nests.eggs.process_management_required')</p>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pConfigFrom" class="form-label">@lang('admin/nests.eggs.copy_settings_from')</label>
                                <select name="config_from" id="pConfigFrom" class="form-control">
                                    <option value="">@lang('strings.none')</option>
                                </select>
                                <p class="text-muted small">@lang('admin/nests.eggs.copy_settings_from_help')</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigStop" class="form-label">@lang('admin/nests.eggs.stop_command')</label>
                                <input type="text" id="pConfigStop" name="config_stop" class="form-control" value="{{ old('config_stop') }}" />
                                <p class="text-muted small">@lang('admin/nests.eggs.stop_command_help')</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigLogs" class="form-label">@lang('admin/nests.eggs.log_configuration')</label>
                                <textarea data-action="handle-tabs" id="pConfigLogs" name="config_logs" class="form-control" rows="6">{{ old('config_logs') }}</textarea>
                                <p class="text-muted small">@lang('admin/nests.eggs.log_configuration_help')</p>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pConfigFiles" class="form-label">@lang('admin/nests.eggs.config_files')</label>
                                <textarea data-action="handle-tabs" id="pConfigFiles" name="config_files" class="form-control" rows="6">{{ old('config_files') }}</textarea>
                                <p class="text-muted small">@lang('admin/nests.eggs.config_files_help')</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigStartup" class="form-label">@lang('admin/nests.eggs.start_configuration')</label>
                                <textarea data-action="handle-tabs" id="pConfigStartup" name="config_startup" class="form-control" rows="6">{{ old('config_startup') }}</textarea>
                                <p class="text-muted small">@lang('admin/nests.eggs.start_configuration_help')</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-success btn-sm pull-right">@lang('strings.create')</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('footer-scripts')
    @parent
    {!! Theme::js('vendor/lodash/lodash.js') !!}
    <script>
    $(document).ready(function() {
        $('#pNestId').select2().change();
        $('#pConfigFrom').select2();
    });
    $('#pNestId').on('change', function (event) {
        $('#pConfigFrom').html('<option value="">{{ trans('strings.none') }}</option>').select2({
            data: $.map(_.get(Pterodactyl.nests, $(this).val() + '.eggs', []), function (item) {
                return {
                    id: item.id,
                    text: item.name + ' <' + item.author + '>',
                };
            }),
        });
    });
    $('textarea[data-action="handle-tabs"]').on('keydown', function(event) {
        if (event.keyCode === 9) {
            event.preventDefault();

            var curPos = $(this)[0].selectionStart;
            var prepend = $(this).val().substr(0, curPos);
            var append = $(this).val().substr(curPos);

            $(this).val(prepend + '    ' + append);
        }
    });
    $('#pConfigFeatures').select2({
        tags: true,
        selectOnClose: false,
        tokenSeparators: [',', ' '],
    });
    </script>
@endsection
