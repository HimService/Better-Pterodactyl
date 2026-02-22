@extends('layouts.admin')

@section('title')
    @lang('admin/server.tabs.about') — {{ $server->name }}: @lang('admin/server.tabs.delete')
@endsection

@section('content-header')
    <h1>{{ $server->name }}<small>@lang('admin/server.delete.header_help')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.servers') }}">@lang('admin/index.common.servers')</a></li>
        <li><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></li>
        <li class="active">@lang('admin/server.tabs.delete')</li>
    </ol>
@endsection

@section('content')
@include('admin.servers.partials.navigation')
<div class="row">
    <div class="col-md-6">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">@lang('admin/server.delete.safe_delete')</h3>
            </div>
            <div class="box-body">
                <p>@lang('admin/server.delete.safe_delete_help')</p>
                <p class="text-danger small">{!! trans('admin/server.delete.safe_delete_warning') !!}</p>
            </div>
            <div class="box-footer">
                <form id="deleteform" action="{{ route('admin.servers.view.delete', $server->id) }}" method="POST">
                    {!! csrf_field() !!}
                    <button id="deletebtn" class="btn btn-danger">@lang('admin/server.delete.safe_delete_btn')</button>
                </form>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="box box-danger">
            <div class="box-header with-border">
                <h3 class="box-title">@lang('admin/server.delete.force_delete')</h3>
            </div>
            <div class="box-body">
                <p>@lang('admin/server.delete.force_delete_help')</p>
                <p class="text-danger small">{!! trans('admin/server.delete.force_delete_warning') !!}</p>
            </div>
            <div class="box-footer">
                <form id="forcedeleteform" action="{{ route('admin.servers.view.delete', $server->id) }}" method="POST">
                    {!! csrf_field() !!}
                    <input type="hidden" name="force_delete" value="1" />
                    <button id="forcedeletebtn"" class="btn btn-danger">@lang('admin/server.delete.force_delete_btn')</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#deletebtn').click(function (event) {
        event.preventDefault();
        swal({
            title: '',
            type: 'warning',
            text: '@lang('admin/server.database.delete_warning')',
            showCancelButton: true,
            confirmButtonText: '@lang('strings.delete')',
            confirmButtonColor: '#d9534f',
            closeOnConfirm: false
        }, function () {
            $('#deleteform').submit()
        });
    });

    $('#forcedeletebtn').click(function (event) {
        event.preventDefault();
        swal({
            title: '',
            type: 'warning',
            text: '@lang('admin/server.database.delete_warning')',
            showCancelButton: true,
            confirmButtonText: '@lang('strings.delete')',
            confirmButtonColor: '#d9534f',
            closeOnConfirm: false
        }, function () {
            $('#forcedeleteform').submit()
        });
    });
    </script>
@endsection
