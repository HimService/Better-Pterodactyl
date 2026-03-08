@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'advanced'])

@php
    if (!class_exists('BetterPterodactyl\Verification\DB')) {
        require_once base_path('resources/settings/verification/helpers.php');
    }
    $verificationSettings = \BetterPterodactyl\Verification\DB::getSettings();
@endphp

@section('title')
    @lang('admin/settings.nav.advanced')
@endsection

@section('content-header')
    <h1>@lang('admin/settings.advanced.title')<small>@lang('admin/settings.advanced.description')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li class="active">@lang('strings.settings')</li>
    </ol>
@endsection

@section('content')
    @yield('settings::nav')
    <div class="row">
        <div class="col-xs-12">
            <form action="" method="POST">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">@lang('admin/settings.advanced.verification_type')</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">@lang('strings.status')</label>
                                <div>
                                    <select class="form-control" name="verification_enabled">
                                        <option value="true" @if(old('verification_enabled', $verificationSettings['enabled'])) selected @endif>@lang('strings.enable')</option>
                                        <option value="false" @if(!old('verification_enabled', $verificationSettings['enabled'])) selected @endif>@lang('strings.disable')</option>
                                    </select>
                                    <p class="text-muted small">@lang('admin/settings.advanced.verification_help')</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">@lang('admin/settings.advanced.verification_type')</label>
                                <div>
                                    <select class="form-control" name="verification_type">
                                        <option value="recaptcha" @if(old('verification_type', $verificationSettings['verification_type']) === 'recaptcha') selected @endif>@lang('admin/settings.advanced.verification_recaptcha')</option>
                                        <option value="turnstile" @if(old('verification_type', $verificationSettings['verification_type']) === 'turnstile') selected @endif>@lang('admin/settings.advanced.verification_turnstile')</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <hr />
                        <div class="row">
                            <div class="col-xs-12">
                                <h4 class="box-title" style="font-size: 16px; margin-bottom: 15px;">@lang('admin/settings.advanced.verification_recaptcha')</h4>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">@lang('admin/settings.advanced.verification_site_key')</label>
                                <div>
                                    <input type="text" class="form-control" name="verification_recaptcha_site_key" value="{{ old('verification_recaptcha_site_key', $verificationSettings['recaptcha_site_key']) }}">
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">@lang('admin/settings.advanced.verification_secret_key')</label>
                                <div>
                                    <input type="password" class="form-control" name="verification_recaptcha_secret_key" value="{{ old('verification_recaptcha_secret_key', $verificationSettings['recaptcha_secret_key']) }}">
                                </div>
                            </div>
                            <div class="col-xs-12">
                                <p class="text-muted small">@lang('admin/settings.advanced.recaptcha_help')</p>
                            </div>
                            @if($showRecaptchaWarning)
                                <div class="col-xs-12">
                                    <div class="alert alert-warning no-margin" style="margin-top: 15px;">
                                        {!! trans('admin/settings.advanced.verification_warning') !!}
                                    </div>
                                </div>
                            @endif
                        </div>
                        <hr />
                        <div class="row">
                            <div class="col-xs-12">
                                <h4 class="box-title" style="font-size: 16px; margin-bottom: 15px;">@lang('admin/settings.advanced.verification_turnstile')</h4>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">@lang('admin/settings.advanced.verification_site_key')</label>
                                <div>
                                    <input type="text" class="form-control" name="verification_turnstile_site_key" value="{{ old('verification_turnstile_site_key', $verificationSettings['turnstile_site_key']) }}">
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">@lang('admin/settings.advanced.verification_secret_key')</label>
                                <div>
                                    <input type="password" class="form-control" name="verification_turnstile_secret_key" value="{{ old('verification_turnstile_secret_key', $verificationSettings['turnstile_secret_key']) }}">
                                </div>
                            </div>
                            <div class="col-xs-12">
                                <p class="text-muted small">@lang('admin/settings.advanced.turnstile_help')</p>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Add hidden original recaptcha fields to avoid breaking the core controller if it expects them -->
                <input type="hidden" name="recaptcha:enabled" value="false">
                <input type="hidden" name="recaptcha:website_key" value="{{ $verificationSettings['recaptcha_site_key'] }}">
                <input type="hidden" name="recaptcha:secret_key" value="{{ $verificationSettings['recaptcha_secret_key'] }}">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">@lang('admin/settings.advanced.http_title')</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">@lang('admin/settings.advanced.http_connect_timeout')</label>
                                <div>
                                    <input type="number" required class="form-control" name="pterodactyl:guzzle:connect_timeout" value="{{ old('pterodactyl:guzzle:connect_timeout', config('pterodactyl.guzzle.connect_timeout')) }}">
                                    <p class="text-muted small">@lang('admin/settings.advanced.http_connect_timeout_help')</p>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">@lang('admin/settings.advanced.http_request_timeout')</label>
                                <div>
                                    <input type="number" required class="form-control" name="pterodactyl:guzzle:timeout" value="{{ old('pterodactyl:guzzle:timeout', config('pterodactyl.guzzle.timeout')) }}">
                                    <p class="text-muted small">@lang('admin/settings.advanced.http_request_timeout_help')</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">@lang('admin/settings.advanced.allocation_title')</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">@lang('strings.status')</label>
                                <div>
                                    <select class="form-control" name="pterodactyl:client_features:allocations:enabled">
                                        <option value="false">@lang('strings.disable')</option>
                                        <option value="true" @if(old('pterodactyl:client_features:allocations:enabled', config('pterodactyl.client_features.allocations.enabled'))) selected @endif>@lang('strings.enable')</option>
                                    </select>
                                    <p class="text-muted small">@lang('admin/settings.advanced.allocation_help')</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">@lang('admin/settings.advanced.allocation_starting_port')</label>
                                <div>
                                    <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_start" value="{{ old('pterodactyl:client_features:allocations:range_start', config('pterodactyl.client_features.allocations.range_start')) }}">
                                    <p class="text-muted small">@lang('admin/settings.advanced.allocation_starting_port_help')</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">@lang('admin/settings.advanced.allocation_ending_port')</label>
                                <div>
                                    <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_end" value="{{ old('pterodactyl:client_features:allocations:range_end', config('pterodactyl.client_features.allocations.range_end')) }}">
                                    <p class="text-muted small">@lang('admin/settings.advanced.allocation_ending_port_help')</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box box-primary">
                    <div class="box-footer">
                        {{ csrf_field() }}
                        <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">@lang('strings.save')</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
@endsection
