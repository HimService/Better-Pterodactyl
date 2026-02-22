@extends('layouts.admin')

@section('title')
    @lang('admin/nests.index.title') &rarr; {{ $nest->name }}
@endsection

@section('content-header')
    <h1>{{ $nest->name }}<small>{{ str_limit($nest->description, 50) }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.nests') }}">@lang('admin/nests.index.title')</a></li>
        <li class="active">{{ $nest->name }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <form action="{{ route('admin.nests.view', $nest->id) }}" method="POST">
        <div class="col-md-6">
            <div class="box">
                <div class="box-body">
                    <div class="form-group">
                        <label class="control-label">@lang('strings.name') <span class="field-required"></span></label>
                        <div>
                            <input type="text" name="name" class="form-control" value="{{ $nest->name }}" />
                             <p class="text-muted"><small>@lang('admin/nests.new.name_help')</small></p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label">@lang('strings.description')</label>
                        <div>
                            <textarea name="description" class="form-control" rows="7">{{ $nest->description }}</textarea>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" name="_method" value="PATCH" class="btn btn-primary btn-sm pull-right">@lang('strings.save')</button>
                    <button id="deleteButton" type="submit" name="_method" value="DELETE" class="btn btn-sm btn-danger muted muted-hover"><i class="fa fa-trash-o"></i></button>
                </div>
            </div>
        </div>
    </form>
    <div class="col-md-6">
        <div class="box">
            <div class="box-body">
                <div class="form-group">
                    <label class="control-label">@lang('admin/nests.view.nest_id')</label>
                    <div>
                        <input type="text" readonly class="form-control" value="{{ $nest->id }}" />
                        <p class="text-muted small">@lang('admin/nests.view.nest_id_help')</p>
                    </div>
                </div>
                <div class="form-group">
                    <label class="control-label">@lang('strings.author')</label>
                    <div>
                        <input type="text" readonly class="form-control" value="{{ $nest->author }}" />
                        <p class="text-muted small">@lang('admin/nests.view.author_help')</p>
                    </div>
                </div>
                <div class="form-group">
                    <label class="control-label">@lang('strings.uuid')</label>
                    <div>
                        <input type="text" readonly class="form-control" value="{{ $nest->uuid }}" />
                        <p class="text-muted small">@lang('admin/nests.view.uuid_help')</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">@lang('admin/nests.view.nest_eggs')</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>@lang('strings.id')</th>
                        <th>@lang('strings.name')</th>
                        <th>@lang('strings.description')</th>
                        <th class="text-center">@lang('admin/nests.index.servers')</th>
                        <th class="text-center"></th>
                    </tr>
                    @foreach($nest->eggs as $egg)
                        <tr>
                            <td class="align-middle"><code>{{ $egg->id }}</code></td>
                            <td class="align-middle"><a href="{{ route('admin.nests.egg.view', $egg->id) }}" data-toggle="tooltip" data-placement="right" title="{{ $egg->author }}">{{ $egg->name }}</a></td>
                            <td class="col-xs-8 align-middle">{{ $egg->description }}</td>
                            <td class="text-center align-middle"><code>{{ $egg->servers->count() }}</code></td>
                            <td class="align-middle">
                                <a href="{{ route('admin.nests.egg.export', ['egg' => $egg->id]) }}"><i class="fa fa-download"></i></a>
                            </td>
                        </tr>
                    @endforeach
                </table>
            </div>
            <div class="box-footer">
                <a href="{{ route('admin.nests.egg.new') }}"><button class="btn btn-success btn-sm pull-right">@lang('admin/nests.view.new_egg')</button></a>
            </div>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('#deleteButton').on('mouseenter', function (event) {
            $(this).find('i').html('{{ trans('admin/nests.view.delete_nest') }}');
        }).on('mouseleave', function (event) {
            $(this).find('i').html('');
        });
    </script>
@endsection
