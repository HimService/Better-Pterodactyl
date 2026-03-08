@extends('layouts.admin')

@section('title')
    @lang('admin/tickets.ticket_details') #{{ $ticket['id'] }}
@endsection

@section('content-header')
    <h1>@lang('admin/tickets.ticket_details')<small>@lang('admin/tickets.ticket_details_sub')</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">@lang('admin/index.admin')</a></li>
        <li><a href="{{ route('admin.tickets') }}">@lang('admin/tickets.header')</a></li>
        <li class="active">#{{ $ticket['id'] }}</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-md-4">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/tickets.ticket_info')</h3>
                </div>
                <div class="box-body" style="padding-top: 15px;">
                    <div style="margin-bottom: 20px;">
                        <label style="color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">@lang('admin/tickets.subject')</label>
                        <p style="font-size: 1.1rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0;">{{ $ticket['subject'] }}</p>
                    </div>
                    
                    <div style="margin-bottom: 20px; padding-top: 15px; border-top: 1px dashed #334155;">
                        <label style="color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">@lang('admin/tickets.created_user')</label>
                        <p style="margin-bottom: 0; color: #e2e8f0;">{{ $ticket['user_name'] }} <span class="text-muted" style="font-size: 0.9em;">(ID: {{ $ticket['user_id'] }})</span></p>
                    </div>

                    <div style="margin-bottom: 20px; padding-top: 15px; border-top: 1px dashed #334155;">
                        <label style="color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">@lang('admin/tickets.category')</label>
                        <p style="margin-bottom: 0;"><span class="label label-default" style="background-color: #334155 !important; border: 1px solid #475569;">{{ $ticket['category'] }}</span></p>
                    </div>

                    <div style="margin-bottom: 20px; padding-top: 15px; border-top: 1px dashed #334155;">
                        <label style="color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">@lang('admin/tickets.priority')</label>
                        <p style="margin-bottom: 0;">
                            @if($ticket['priority'] === 'high')
                                <span class="label label-danger"><i class="fa fa-exclamation-triangle"></i> High</span>
                            @elseif($ticket['priority'] === 'normal')
                                <span class="label label-primary"><i class="fa fa-info-circle"></i> Normal</span>
                            @else
                                <span class="label label-info"><i class="fa fa-check-circle"></i> Low</span>
                            @endif
                        </p>
                    </div>

                    <div style="padding-top: 15px; border-top: 1px dashed #334155;">
                        <label style="color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">@lang('admin/tickets.created_at')</label>
                        <p style="margin-bottom: 0; color: #94a3b8; font-size: 0.95rem;"><i class="fa fa-calendar-o"></i> {{ $ticket['created_at'] }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-8">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">@lang('admin/tickets.chat_logs')</h3>
                </div>
                <div class="box-body chat" id="chat-box" style="max-height: 600px; overflow-y: auto; padding: 20px; background-color: #0f172a;">
                    @foreach($comments as $comment)
                        <div class="item" style="margin-bottom: 25px; clear: both;">
                            <img src="https://www.gravatar.com/avatar/{{ md5(strtolower($comment['user_name'])) }}?s=128&d=identicon" alt="user image" style="width: 45px; height: 45px; border-radius: 12px; float: {{ $comment['is_admin'] ? 'right' : 'left' }}; border: 2px solid {{ $comment['is_admin'] ? '#4f46e5' : '#334155' }}; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                            
                            <div class="message-container" style="margin-{{ $comment['is_admin'] ? 'right' : 'left' }}: 60px;">
                                <div class="message-header" style="margin-bottom: 5px; text-align: {{ $comment['is_admin'] ? 'right' : 'left' }};">
                                    <span style="font-weight: 600; color: #f1f5f9; font-size: 0.95rem;">
                                        {{ $comment['user_name'] }}
                                        @if($comment['is_admin'])
                                            <span class="label label-danger" style="font-size: 0.7rem; padding: 2px 6px; margin-left: 5px; background-color: #ef4444 !important;">@lang('admin/tickets.admin')</span>
                                        @endif
                                    </span>
                                    <small class="text-muted" style="display: block; font-size: 0.8rem; margin-top: 2px;">{{ $comment['created_at'] }}</small>
                                </div>
                                
                                <div class="message-bubble" style="
                                    background-color: {{ $comment['is_admin'] ? '#1e293b' : '#334155' }};
                                    color: #f1f5f9;
                                    padding: 12px 18px;
                                    border-radius: 16px;
                                    border-{{ $comment['is_admin'] ? 'top-right' : 'top-left' }}-radius: 4px;
                                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                                    border: 1px solid {{ $comment['is_admin'] ? '#4f46e5' : '#475569' }};
                                    display: inline-block;
                                    max-width: 85%;
                                    float: {{ $comment['is_admin'] ? 'right' : 'left' }};
                                    text-align: left;
                                    line-height: 1.6;
                                ">
                                    {!! nl2br(e($comment['comment'])) !!}
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
                <div class="box-footer" style="background-color: #1e293b; border-top: 1px solid #334155; padding: 20px;">
                    <form action="{{ route('admin.tickets.comment', $ticket['id']) }}" method="POST" onsubmit="this.querySelector('button[type=submit]').disabled = true; this.querySelector('button[type=submit]').innerHTML = '<i class=\'fa fa-spinner fa-spin\'></i> Processing...';">
                        {!! csrf_field() !!}
                        <div class="form-group" style="margin-bottom: 20px;">
                            <textarea name="comment" class="form-control" rows="4" style="background-color: #0f172a; border: 1px solid #334155; color: #f1f5f9; border-radius: 12px; padding: 15px; resize: vertical;" placeholder="@lang('admin/tickets.reply_placeholder')"></textarea>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                            <div style="display: flex; align-items: center; background: #0f172a; padding: 5px 15px; border-radius: 10px; border: 1px solid #334155;">
                                <span style="color: #94a3b8; font-size: 0.9rem; margin-right: 12px; font-weight: 500;">
                                    <i class="fa fa-tag"></i> @lang('admin/tickets.ticket_status'):
                                </span>
                                <select name="status" class="form-control" style="width: auto; display: inline-block; background-color: transparent; border: none; color: #f1f5f9; padding: 0; height: 35px; cursor: pointer; font-weight: 600;">
                                    <option value="open" @if($ticket['status'] === 'open') selected @endif>@lang('admin/tickets.keep_open')</option>
                                    <option value="resolved" @if($ticket['status'] === 'resolved') selected @endif>@lang('admin/tickets.mark_resolved')</option>
                                    <option value="closed" @if($ticket['status'] === 'closed') selected @endif>@lang('admin/tickets.close_ticket')</option>
                                </select>
                            </div>
                            
                            <button type="submit" class="btn btn-primary" style="padding: 10px 30px; border-radius: 12px; font-weight: 600; background-color: #4f46e5; border: none; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4); transition: all 0.2s ease;">
                                <i class="fa fa-paper-plane"></i> @lang('admin/tickets.send_reply')
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $(document).ready(function() {
            var chatBox = $('#chat-box');
            chatBox.scrollTop(chatBox.prop("scrollHeight"));
        });
    </script>
@endsection
