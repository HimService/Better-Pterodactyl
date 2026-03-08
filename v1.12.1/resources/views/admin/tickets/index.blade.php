@extends('layouts.admin')

@section('title')
    @lang('admin/tickets.title')
@endsection

@section('content-header')
    <h1>@lang('admin/tickets.header')<small>@lang('admin/tickets.header_sub')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li class="active">@lang('admin/tickets.header')</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/tickets.system_settings')</h3>
                </div>
                <form action="{{ route('admin.tickets.settings') }}" method="POST">
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">@lang('admin/tickets.status')</label>
                                <div>
                                    <select class="form-control" name="enabled">
                                        <option value="true" @if($settings['enabled']) selected @endif>@lang('strings.enable')</option>
                                        <option value="false" @if(!$settings['enabled']) selected @endif>@lang('strings.disable')</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">@lang('admin/tickets.max_per_user')</label>
                                <div>
                                    <input type="number" class="form-control" name="max_per_user" value="{{ $settings['max_per_user'] }}">
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">@lang('admin/tickets.discord_webhook')</label>
                                <div>
                                    <input type="text" class="form-control" name="discord_webhook" value="{{ $settings['discord_webhook'] }}">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="box-footer">
                        {!! csrf_field() !!}
                        {!! method_field('PATCH') !!}
                        <button type="submit" class="btn btn-primary btn-sm pull-right">@lang('admin/tickets.save_settings')</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/tickets.ticket_list')</h3>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <th>ID</th>
                                <th>@lang('admin/tickets.user')</th>
                                <th>@lang('admin/tickets.subject')</th>
                                <th>@lang('admin/tickets.category')</th>
                                <th>@lang('admin/tickets.priority')</th>
                                <th>@lang('admin/tickets.ticket_status')</th>
                                <th>@lang('admin/tickets.last_updated')</th>
                                <th></th>
                            </tr>
                            @foreach ($tickets as $ticket)
                                <tr>
                                    <td><code>#{{ $ticket['id'] }}</code></td>
                                    <td>{{ $ticket['user_name'] }} <br><small class="text-muted">{{ $ticket['user_email'] }}</small></td>
                                    <td>{{ $ticket['subject'] }}</td>
                                    <td><span class="label label-default">{{ $ticket['category'] }}</span></td>
                                    <td>
                                        @if($ticket['priority'] === 'high')
                                            <span class="label label-danger">High</span>
                                        @elseif($ticket['priority'] === 'normal')
                                            <span class="label label-primary">Normal</span>
                                        @else
                                            <span class="label label-info">Low</span>
                                        @endif
                                    </td>
                                    <td>
                                        @if($ticket['status'] === 'open')
                                            <span class="label label-success">Open</span>
                                        @elseif($ticket['status'] === 'resolved')
                                            <span class="label label-warning">Resolved</span>
                                        @else
                                            <span class="label label-default">Closed</span>
                                        @endif
                                    </td>
                                    <td>{{ $ticket['updated_at'] }}</td>
                                    <td class="text-center">
                                        <a href="{{ route('admin.tickets.view', $ticket['id']) }}" class="btn btn-xs btn-default"><i class="fa fa-eye"></i> @lang('admin/tickets.view_and_reply')</a>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection
