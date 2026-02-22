@extends('layouts.admin')

@section('title')
    @lang('admin/nests.new.title')
@endsection

@section('content-header')
    <h1>@lang('admin/nests.new.title')<small>@lang('admin/nests.new.description')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.nests') }}">@lang('admin/nests.index.title')</a></li>
        <li class="active">@lang('strings.new')</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.nests.new') }}" method="POST">
    <div class="row">
        <div class="col-md-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/nests.new.title')</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label class="control-label">@lang('strings.name')</label>
                        <div>
                            <input type="text" name="name" class="form-control" value="{{ old('name') }}" />
                             <p class="text-muted"><small>@lang('admin/nests.new.name_help')</small></p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label">@lang('strings.description')</label>
                        <div>
                            <textarea name="description" class="form-control" rows="6">{{ old('description') }}</textarea>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary pull-right">@lang('strings.save')</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection
