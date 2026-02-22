@extends('layouts.admin')

@section('title')
    @lang('admin/server.tabs.about') — {{ $server->name }}: @lang('admin/server.tabs.database')
@endsection

@section('content-header')
    <h1>{{ $server->name }}<small>@lang('admin/server.database.header_help')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.servers') }}">@lang('admin/index.common.servers')</a></li>
        <li><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></li>
        <li class="active">@lang('admin/server.tabs.database')</li>
    </ol>
@endsection

@section('content')
@include('admin.servers.partials.navigation')
<div class="row">
    <div class="col-sm-7">
        <div class="alert alert-info">
            {!! trans('admin/server.database.view_as_client', ['uuid' => $server->uuidShort]) !!}
        </div>
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">@lang('admin/server.database.active_databases')</h3>
            </div>
            <div class="box-body table-responsible no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>@lang('strings.database')</th>
                        <th>@lang('strings.username')</th>
                        <th>@lang('admin/server.database.remote_connections')</th>
                        <th>@lang('strings.host')</th>
                        <th>@lang('admin/server.database.max_connections')</th>
                        <th></th>
                    </tr>
                    @foreach($server->databases as $database)
                        <tr>
                            <td>{{ $database->database }}</td>
                            <td>{{ $database->username }}</td>
                            <td>{{ $database->remote }}</td>
                            <td><code>{{ $database->host->host }}:{{ $database->host->port }}</code></td>
                            @if($database->max_connections != null)
                                <td>{{ $database->max_connections }}</td>
                            @else
                                <td>@lang('admin/server.view.unlimited')</td>
                            @endif
                            <td class="text-center">
                                <button data-action="reset-password" data-id="{{ $database->id }}" class="btn btn-xs btn-primary"><i class="fa fa-refresh"></i></button>
                                <button data-action="remove" data-id="{{ $database->id }}" class="btn btn-xs btn-danger"><i class="fa fa-trash"></i></button>
                            </td>
                        </tr>
                    @endforeach
                </table>
            </div>
        </div>
    </div>
    <div class="col-sm-5">
        <div class="box box-success">
            <div class="box-header with-border">
                <h3 class="box-title">@lang('admin/server.database.create_database')</h3>
            </div>
            <form action="{{ route('admin.servers.view.database', $server->id) }}" method="POST">
                <div class="box-body">
                    <div class="form-group">
                        <label for="pDatabaseHostId" class="control-label">@lang('admin/server.new.database_host')</label>
                        <select id="pDatabaseHostId" name="database_host_id" class="form-control">
                            @foreach($hosts as $host)
                                <option value="{{ $host->id }}">{{ $host->name }}</option>
                            @endforeach
                        </select>
                        <p class="text-muted small">@lang('admin/server.database.host_help')</p>
                    </div>
                    <div class="form-group">
                        <label for="pDatabaseName" class="control-label">@lang('strings.database')</label>
                        <div class="input-group">
                            <span class="input-group-addon">s{{ $server->id }}_</span>
                            <input id="pDatabaseName" type="text" name="database" class="form-control" placeholder="database" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="pRemote" class="control-label">@lang('admin/server.database.remote_connections')</label>
                        <input id="pRemote" type="text" name="remote" class="form-control" value="%" />
                        <p class="text-muted small">@lang('admin/server.database.remote_help')</p>
                    </div>
                    <div class="form-group">
                        <label for="pmax_connections" class="control-label">@lang('admin/server.database.max_connections')</label>
                        <input id="pmax_connections" type="text" name="max_connections" class="form-control"/>
                        <p class="text-muted small">@lang('admin/server.database.concurrent_connections_help')</p>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <p class="text-muted small no-margin">@lang('admin/server.database.password_help')</p>
                    <input type="submit" class="btn btn-sm btn-success pull-right" value="@lang('admin/server.database.create_database')" />
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#pDatabaseHost').select2();
    $('[data-action="remove"]').click(function (event) {
        event.preventDefault();
        var self = $(this);
        swal({
            title: '',
            type: 'warning',
            text: '@lang('admin/server.database.delete_warning')',
            showCancelButton: true,
            confirmButtonText: '@lang('strings.delete')',
            confirmButtonColor: '#d9534f',
            closeOnConfirm: false,
            showLoaderOnConfirm: true,
        }, function () {
            $.ajax({
                method: 'DELETE',
                url: '/admin/servers/view/{{ $server->id }}/database/' + self.data('id') + '/delete',
                headers: { 'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content') },
            }).done(function () {
                self.parent().parent().slideUp();
                swal.close();
            }).fail(function (jqXHR) {
                console.error(jqXHR);
                swal({
                    type: 'error',
                    title: 'Whoops!',
                    text: (typeof jqXHR.responseJSON.error !== 'undefined') ? jqXHR.responseJSON.error : '@lang('admin/server.exceptions.database_error')'
                });
            });
        });
    });
    $('[data-action="reset-password"]').click(function (e) {
        e.preventDefault();
        var block = $(this);
        $(this).addClass('disabled').find('i').addClass('fa-spin');
        $.ajax({
            type: 'PATCH',
            url: '/admin/servers/view/{{ $server->id }}/database',
            headers: { 'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content') },
            data: { database: $(this).data('id') },
        }).done(function (data) {
            swal({
                type: 'success',
                title: '',
                text: '@lang('admin/server.database.password_reset')',
            });
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error(jqXHR);
            var error = '@lang('admin/server.exceptions.database_error')';
            if (typeof jqXHR.responseJSON !== 'undefined' && typeof jqXHR.responseJSON.error !== 'undefined') {
                error = jqXHR.responseJSON.error;
            }
            swal({
                type: 'error',
                title: 'Whoops!',
                text: error
            });
        }).always(function () {
            block.removeClass('disabled').find('i').removeClass('fa-spin');
        });
    });
    </script>
@endsection
