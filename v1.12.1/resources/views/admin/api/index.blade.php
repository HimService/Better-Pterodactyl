@extends('layouts.admin')

@section('title')
    @lang('admin/index.common.application_api')
@endsection

@section('content-header')
    <h1>@lang('admin/index.common.application_api')<small>@lang('admin/api.index.description')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li class="active">@lang('admin/index.common.application_api')</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/api.index.list')</h3>
                    <div class="box-tools">
                        <a href="{{ route('admin.api.new') }}" class="btn btn-sm btn-primary">@lang('admin/api.index.create_new')</a>
                    </div>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tr>
                            <th>@lang('strings.key')</th>
                            <th>@lang('strings.memo')</th>
                            <th>@lang('strings.last_used')</th>
                            <th>@lang('strings.created')</th>
                            <th>@lang('admin/api.index.created_by')</th>
                            <th></th>
                        </tr>
                        @foreach($keys as $key)
                            <tr>
                                <td><code>
                                    @if (Auth::user()->is($key->user))
                                        {{ $key->identifier . decrypt($key->token) }}
                                    @else
                                        {{ $key->identifier . '****' }}
                                    @endif
                                </code></td>
                                <td>{{ $key->memo }}</td>
                                <td>
                                    @if(!is_null($key->last_used_at))
                                        @datetimeHuman($key->last_used_at)
                                    @else
                                        &mdash;
                                    @endif
                                </td>
                                <td>@datetimeHuman($key->created_at)</td>
                                <td>
                                    <a href="{{ route('admin.users.view', $key->user->id) }}">{{ $key->user->username }}</a>
                                </td>
                                <td>
                                    <a href="#" data-action="revoke-key" data-attr="{{ $key->identifier }}">
                                        <i class="fa fa-trash-o text-danger"></i>
                                    </a>
                                </td>
                            </tr>
                        @endforeach
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $(document).ready(function() {
            $('[data-action="revoke-key"]').click(function (event) {
                var self = $(this);
                event.preventDefault();
                swal({
                    type: 'error',
                    title: '{{ trans('admin/api.index.revoke_key_title') }}',
                    text: '{{ trans('admin/api.index.revoke_key_text') }}',
                    showCancelButton: true,
                    allowOutsideClick: true,
                    closeOnConfirm: false,
                    confirmButtonText: '{{ trans('strings.revoke') }}',
                    confirmButtonColor: '#d9534f',
                    showLoaderOnConfirm: true
                }, function () {
                    $.ajax({
                        method: 'DELETE',
                        url: '/admin/api/revoke/' + self.data('attr'),
                        headers: {
                            'X-CSRF-TOKEN': '{{ csrf_token() }}'
                        }
                    }).done(function () {
                        swal({
                            type: 'success',
                            title: '',
                            text: '{{ trans('admin/api.index.revoked_text') }}'
                        });
                        self.parent().parent().slideUp();
                    }).fail(function (jqXHR) {
                        console.error(jqXHR);
                        swal({
                            type: 'error',
                            title: '{{ trans('admin/api.index.whoops') }}',
                            text: '{{ trans('admin/api.index.revoke_error') }}'
                        });
                    });
                });
            });
        });
    </script>
@endsection
