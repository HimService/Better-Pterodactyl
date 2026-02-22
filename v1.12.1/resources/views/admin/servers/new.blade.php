@extends('layouts.admin')

@section('title')
    @lang('admin/server.new.header')
@endsection

@section('content-header')
    <h1>@lang('admin/server.new.header')<small>@lang('admin/server.new.header_help')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.servers') }}">@lang('admin/index.common.servers')</a></li>
        <li class="active">@lang('admin/server.new.header')</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.servers.new') }}" method="POST">
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/server.new.core_details')</h3>
                </div>

                <div class="box-body row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="pName">@lang('strings.name')</label>
                            <input type="text" class="form-control" id="pName" name="name" value="{{ old('name') }}" placeholder="@lang('strings.name')">
                            <p class="small text-muted no-margin">@lang('admin/server.new.name_help')</p>
                        </div>

                        <div class="form-group">
                            <label for="pUserId">@lang('strings.owner')</label>
                            <select id="pUserId" name="owner_id" class="form-control" style="padding-left:0;"></select>
                            <p class="small text-muted no-margin">@lang('admin/server.new.owner_help')</p>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="pDescription" class="control-label">@lang('strings.description')</label>
                            <textarea id="pDescription" name="description" rows="3" class="form-control">{{ old('description') }}</textarea>
                            <p class="text-muted small">@lang('admin/server.new.description_help')</p>
                        </div>

                        <div class="form-group">
                            <div class="checkbox checkbox-primary no-margin-bottom">
                                <input id="pStartOnCreation" name="start_on_completion" type="checkbox" {{ \Pterodactyl\Helpers\Utilities::checked('start_on_completion', 1) }} />
                                <label for="pStartOnCreation" class="strong">@lang('admin/server.new.start_on_creation')</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="overlay" id="allocationLoader" style="display:none;"><i class="fa fa-refresh fa-spin"></i></div>
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/server.new.allocation_management')</h3>
                </div>

                <div class="box-body row">
                    <div class="form-group col-sm-4">
                        <label for="pNodeId">@lang('strings.node')</label>
                        <select name="node_id" id="pNodeId" class="form-control">
                            @foreach($locations as $location)
                                <optgroup label="{{ $location->long }} ({{ $location->short }})">
                                @foreach($location->nodes as $node)

                                <option value="{{ $node->id }}"
                                    @if($location->id === old('location_id')) selected @endif
                                >{{ $node->name }}</option>

                                @endforeach
                                </optgroup>
                            @endforeach
                        </select>

                        <p class="small text-muted no-margin">@lang('admin/server.new.node_help')</p>
                    </div>

                    <div class="form-group col-sm-4">
                        <label for="pAllocation">@lang('admin/server.new.default_allocation')</label>
                        <select id="pAllocation" name="allocation_id" class="form-control"></select>
                        <p class="small text-muted no-margin">@lang('admin/server.new.default_allocation_help')</p>
                    </div>

                    <div class="form-group col-sm-4">
                        <label for="pAllocationAdditional">@lang('admin/server.new.additional_allocations')</label>
                        <select id="pAllocationAdditional" name="allocation_additional[]" class="form-control" multiple></select>
                        <p class="small text-muted no-margin">@lang('admin/server.new.additional_allocations_help')</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="overlay" id="allocationLoader" style="display:none;"><i class="fa fa-refresh fa-spin"></i></div>
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/server.new.application_feature_limits')</h3>
                </div>

                <div class="box-body row">
                    <div class="form-group col-xs-6">
                        <label for="pDatabaseLimit" class="control-label">@lang('admin/server.new.database_limit')</label>
                        <div>
                            <input type="text" id="pDatabaseLimit" name="database_limit" class="form-control" value="{{ old('database_limit', 0) }}"/>
                        </div>
                        <p class="text-muted small">@lang('admin/server.new.database_limit_help')</p>
                    </div>
                    <div class="form-group col-xs-6">
                        <label for="pAllocationLimit" class="control-label">@lang('admin/server.new.allocation_limit')</label>
                        <div>
                            <input type="text" id="pAllocationLimit" name="allocation_limit" class="form-control" value="{{ old('allocation_limit', 0) }}"/>
                        </div>
                        <p class="text-muted small">@lang('admin/server.new.allocation_limit_help')</p>
                    </div>
                    <div class="form-group col-xs-6">
                        <label for="pBackupLimit" class="control-label">@lang('admin/server.new.backup_limit')</label>
                        <div>
                            <input type="text" id="pBackupLimit" name="backup_limit" class="form-control" value="{{ old('backup_limit', 0) }}"/>
                        </div>
                        <p class="text-muted small">@lang('admin/server.new.backup_limit_help')</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/server.new.resource_management')</h3>
                </div>

                <div class="box-body row">
                    <div class="form-group col-xs-6">
                        <label for="pCPU">@lang('strings.cpu_limit')</label>

                        <div class="input-group">
                            <input type="text" id="pCPU" name="cpu" class="form-control" value="{{ old('cpu', 0) }}" />
                            <span class="input-group-addon">%</span>
                        </div>

                        <p class="text-muted small">@lang('admin/server.new.cpu_help')<p>
                    </div>

                    <div class="form-group col-xs-6">
                        <label for="pThreads">@lang('admin/server.new.cpu_pinning')</label>

                        <div>
                            <input type="text" id="pThreads" name="threads" class="form-control" value="{{ old('threads') }}" />
                        </div>

                        <p class="text-muted small">@lang('admin/server.new.threads_help')</p>
                    </div>
                </div>

                <div class="box-body row">
                    <div class="form-group col-xs-6">
                        <label for="pMemory">@lang('strings.memory')</label>

                        <div class="input-group">
                            <input type="text" id="pMemory" name="memory" class="form-control" value="{{ old('memory') }}" />
                            <span class="input-group-addon">MiB</span>
                        </div>

                        <p class="text-muted small">@lang('admin/server.new.memory_help')</p>
                    </div>

                    <div class="form-group col-xs-6">
                        <label for="pSwap">@lang('admin/server.new.swap')</label>

                        <div class="input-group">
                            <input type="text" id="pSwap" name="swap" class="form-control" value="{{ old('swap', 0) }}" />
                            <span class="input-group-addon">MiB</span>
                        </div>

                        <p class="text-muted small">@lang('admin/server.new.swap_help')</p>
                    </div>
                </div>

                <div class="box-body row">
                    <div class="form-group col-xs-6">
                        <label for="pDisk">@lang('strings.disk_space')</label>

                        <div class="input-group">
                            <input type="text" id="pDisk" name="disk" class="form-control" value="{{ old('disk') }}" />
                            <span class="input-group-addon">MiB</span>
                        </div>

                        <p class="text-muted small">@lang('admin/server.new.disk_help')</p>
                    </div>

                    <div class="form-group col-xs-6">
                        <label for="pIO">@lang('admin/server.new.block_io_weight')</label>

                        <div>
                            <input type="text" id="pIO" name="io" class="form-control" value="{{ old('io', 500) }}" />
                        </div>

                        <p class="text-muted small">@lang('admin/server.new.io_help')</p>
                    </div>
                    <div class="form-group col-xs-12">
                        <div class="checkbox checkbox-primary no-margin-bottom">
                            <input type="checkbox" id="pOomDisabled" name="oom_disabled" value="0" {{ \Pterodactyl\Helpers\Utilities::checked('oom_disabled', 0) }} />
                            <label for="pOomDisabled" class="strong">@lang('admin/server.new.oom_killer')</label>
                        </div>

                        <p class="small text-muted no-margin">@lang('admin/server.new.oom_killer_help')</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/server.new.nest_configuration')</h3>
                </div>

                <div class="box-body row">
                    <div class="form-group col-xs-12">
                        <label for="pNestId">@lang('strings.nest')</label>

                        <select id="pNestId" name="nest_id" class="form-control">
                            @foreach($nests as $nest)
                                <option value="{{ $nest->id }}"
                                    @if($nest->id === old('nest_id'))
                                        selected="selected"
                                    @endif
                                >{{ $nest->name }}</option>
                            @endforeach
                        </select>

                        <p class="small text-muted no-margin">@lang('admin/server.new.nest_help')</p>
                    </div>

                    <div class="form-group col-xs-12">
                        <label for="pEggId">@lang('strings.egg')</label>
                        <select id="pEggId" name="egg_id" class="form-control"></select>
                        <p class="small text-muted no-margin">@lang('admin/server.new.egg_help')</p>
                    </div>
                    <div class="form-group col-xs-12">
                        <div class="checkbox checkbox-primary no-margin-bottom">
                            <input type="checkbox" id="pSkipScripting" name="skip_scripts" value="1" {{ \Pterodactyl\Helpers\Utilities::checked('skip_scripts', 0) }} />
                            <label for="pSkipScripting" class="strong">@lang('admin/server.new.skip_scripts')</label>
                        </div>

                        <p class="small text-muted no-margin">@lang('admin/server.new.skip_scripts_help')</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/server.new.docker_configuration')</h3>
                </div>

                <div class="box-body row">
                    <div class="form-group col-xs-12">
                        <label for="pDefaultContainer">@lang('admin/server.new.docker_image')</label>
                        <select id="pDefaultContainer" name="image" class="form-control"></select>
                        <input id="pDefaultContainerCustom" name="custom_image" value="{{ old('custom_image') }}" class="form-control" placeholder="@lang('admin/server.new.image_help')" style="margin-top:1rem"/>
                        <p class="small text-muted no-margin">@lang('admin/server.new.image_help')</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/server.new.startup_configuration')</h3>
                </div>

                <div class="box-body row">
                    <div class="form-group col-xs-12">
                        <label for="pStartup">@lang('admin/server.new.startup_command')</label>
                        <input type="text" id="pStartup" name="startup" value="{{ old('startup') }}" class="form-control" />
                        <p class="small text-muted no-margin">@lang('admin/server.new.startup_help')</p>
                    </div>
                </div>

                <div class="box-header with-border" style="margin-top:-10px;">
                    <h3 class="box-title">@lang('admin/server.new.service_variables')</h3>
                </div>

                <div class="box-body row" id="appendVariablesTo"></div>

                <div class="box-footer">
                    {!! csrf_field() !!}
                    <input type="submit" class="btn btn-success pull-right" value="@lang('admin/server.new.header')" />
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('footer-scripts')
    @parent
    {!! Theme::js('vendor/lodash/lodash.js') !!}

    <script type="application/javascript">
        // Persist 'Service Variables'
        function serviceVariablesUpdated(eggId, ids) {
            @if (old('egg_id'))
                // Check if the egg id matches.
                if (eggId != '{{ old('egg_id') }}') {
                    return;
                }

                @if (old('environment'))
                    @foreach (old('environment') as $key => $value)
                        $('#' + ids['{{ $key }}']).val('{{ $value }}');
                    @endforeach
                @endif
            @endif
            @if(old('image'))
                $('#pDefaultContainer').val('{{ old('image') }}');
            @endif
        }
        // END Persist 'Service Variables'
    </script>

    {!! Theme::js('js/admin/new-server.js?v=20220530') !!}

    <script type="application/javascript">
        $(document).ready(function() {
            // Persist 'Server Owner' select2
            @if (old('owner_id'))
                $.ajax({
                    url: '/admin/users/accounts.json?user_id={{ old('owner_id') }}',
                    dataType: 'json',
                }).then(function (data) {
                    initUserIdSelect([ data ]);
                });
            @else
                initUserIdSelect();
            @endif
            // END Persist 'Server Owner' select2

            // Persist 'Node' select2
            @if (old('node_id'))
                $('#pNodeId').val('{{ old('node_id') }}').change();

                // Persist 'Default Allocation' select2
                @if (old('allocation_id'))
                    $('#pAllocation').val('{{ old('allocation_id') }}').change();
                @endif
                // END Persist 'Default Allocation' select2

                // Persist 'Additional Allocations' select2
                @if (old('allocation_additional'))
                    const additional_allocations = [];

                    @for ($i = 0; $i < count(old('allocation_additional')); $i++)
                        additional_allocations.push('{{ old('allocation_additional.'.$i)}}');
                    @endfor

                    $('#pAllocationAdditional').val(additional_allocations).change();
                @endif
                // END Persist 'Additional Allocations' select2
            @endif
            // END Persist 'Node' select2

            // Persist 'Nest' select2
            @if (old('nest_id'))
                $('#pNestId').val('{{ old('nest_id') }}').change();

                // Persist 'Egg' select2
                @if (old('egg_id'))
                    $('#pEggId').val('{{ old('egg_id') }}').change();
                @endif
                // END Persist 'Egg' select2
            @endif
            // END Persist 'Nest' select2
        });
    </script>
@endsection
