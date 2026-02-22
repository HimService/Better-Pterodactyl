
@extends('layouts.admin')

@section('title')
    @lang('admin/mounts.index.title')
@endsection

@section('content-header')
    <h1>@lang('admin/mounts.index.title')<small>@lang('admin/mounts.index.description')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li class="active">@lang('admin/mounts.index.title')</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/mounts.index.list')</h3>

                    <div class="box-tools">
                        <form action="{{ route('admin.mounts') }}" method="GET">
                            <div class="input-group input-group-sm">
                                <input type="text" name="filter[name]" class="form-control pull-right" value="{{ request()->input('filter.name') }}" placeholder="@lang('strings.search')">
                                <div class="input-group-btn">
                                    <button type="submit" class="btn btn-default"><i class="fa fa-search"></i></button>
                                    <button type="button" class="btn btn-sm btn-primary" data-toggle="modal" data-target="#newMountModal" style="border-radius: 0 3px 3px 0;margin-left:-1px;">@lang('admin/mounts.index.create_new')</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <th>@lang('strings.id')</th>
                                <th>@lang('strings.name')</th>
                                <th>@lang('admin/mounts.index.source')</th>
                                <th>@lang('admin/mounts.index.target')</th>
                                <th class="text-center">@lang('admin/mounts.index.read_only')</th>
                                <th class="text-center">@lang('admin/mounts.index.user_mountable')</th>
                                <th class="text-center">@lang('admin/mounts.index.nodes')</th>
                                <th class="text-center">@lang('admin/mounts.index.servers')</th>
                            </tr>

                            @foreach ($mounts as $mount)
                                <tr>
                                    <td><code>{{ $mount->id }}</code></td>
                                    <td><a href="{{ route('admin.mounts.view', $mount->id) }}">{{ $mount->name }}</a></td>
                                    <td><code>{{ $mount->source }}</code></td>
                                    <td><code>{{ $mount->target }}</code></td>
                                    <td class="text-center">{{ $mount->read_only ? trans('admin/mounts.view.true') : trans('admin/mounts.view.false') }}</td>
                                    <td class="text-center">{{ $mount->user_mountable ? trans('admin/mounts.view.true') : trans('admin/mounts.view.false') }}</td>
                                    <td class="text-center">{{ $mount->nodes_count }}</td>
                                    <td class="text-center">{{ $mount->servers_count }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="newMountModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <form action="{{ route('admin.mounts') }}" method="POST">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true" style="color: #FFFFFF">&times;</span>
                        </button>

                        <h4 class="modal-title">@lang('admin/mounts.index.create_new')</h4>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-12">
                                <label for="pName" class="form-label">@lang('strings.name')</label>
                                <input type="text" id="pName" name="name" class="form-control" />
                                <p class="text-muted small">@lang('admin/mounts.index.name_help')</p>
                            </div>

                            <div class="col-md-12">
                                <label for="pDescription" class="form-label">@lang('strings.description')</label>
                                <textarea id="pDescription" name="description" class="form-control" rows="4"></textarea>
                                <p class="text-muted small">@lang('admin/mounts.index.description_help')</p>
                            </div>

                            <div class="col-md-6">
                                <label for="pSource" class="form-label">@lang('admin/mounts.index.source')</label>
                                <input type="text" id="pSource" name="source" class="form-control" />
                                <p class="text-muted small">@lang('admin/mounts.index.source_help')</p>
                            </div>

                            <div class="col-md-6">
                                <label for="pTarget" class="form-label">@lang('admin/mounts.index.target')</label>
                                <input type="text" id="pTarget" name="target" class="form-control" />
                                <p class="text-muted small">@lang('admin/mounts.index.target_help')</p>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">@lang('admin/mounts.index.read_only')</label>

                                <div>
                                    <div class="radio radio-success radio-inline">
                                        <input type="radio" id="pReadOnlyFalse" name="read_only" value="0" checked>
                                        <label for="pReadOnlyFalse">@lang('strings.no')</label>
                                    </div>

                                    <div class="radio radio-warning radio-inline">
                                        <input type="radio" id="pReadOnly" name="read_only" value="1">
                                        <label for="pReadOnly">@lang('strings.yes')</label>
                                    </div>
                                </div>

                                <p class="text-muted small">@lang('admin/mounts.index.read_only_help')</p>
                            </div>

                            <div class="col-md-6">
                                <label class="control-label">@lang('admin/mounts.index.user_mountable')</label>

                                <div>
                                    <div class="radio radio-success radio-inline">
                                        <input type="radio" id="pUserMountableFalse" name="user_mountable" value="0" checked>
                                        <label for="pUserMountableFalse">@lang('strings.no')</label>
                                    </div>

                                    <div class="radio radio-warning radio-inline">
                                        <input type="radio" id="pUserMountable" name="user_mountable" value="1">
                                        <label for="pUserMountable">@lang('strings.yes')</label>
                                    </div>
                                </div>

                                <p class="text-muted small">@lang('admin/mounts.index.user_mountable_help')</p>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-default btn-sm pull-left" data-dismiss="modal">@lang('strings.close')</button>
                        {!! csrf_field() !!}
                        <button type="submit" class="btn btn-primary btn-sm">@lang('strings.create')</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
