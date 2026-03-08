import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import Spinner from '@/components/elements/Spinner';
import axios from 'axios';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import Input from '@/components/elements/Input';

interface Comment {
    id: number;
    user_id: number;
    comment: string;
    is_admin: boolean;
    created_at: string;
}

interface Ticket {
    id: number;
    subject: string;
    status: string;
    priority: string;
}

const TicketChatContainer = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadTicket = () => {
        axios.get(`/api/client/tickets/${id}`)
            .then(({ data }) => {
                setTicket(data.ticket);
                setComments(data.comments);
            })
            .catch(error => {
                console.error(error);
                // @ts-ignore
                if (window.swal) {
                    // @ts-ignore
                    window.swal.fire({
                        title: t('common.error'),
                        text: error.response?.data?.error || t('tickets.errors.load_failed'),
                        icon: 'error',
                        confirmButtonColor: '#3b82f6',
                    });
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadTicket();
    }, [id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const onSendMessage = () => {
        if (!message.trim() || submitting) return;
        setSubmitting(true);
        axios.post(`/api/client/tickets/${id}/comment`, { comment: message })
            .then(() => {
                setMessage('');
                loadTicket();
            })
            .catch(error => {
                console.error(error);
                // @ts-ignore
                if (window.swal) {
                    // @ts-ignore
                    window.swal.fire({
                        title: t('common.error'),
                        text: error.response?.data?.error || t('tickets.errors.send_failed'),
                        icon: 'error',
                        confirmButtonColor: '#3b82f6',
                    });
                }
            })
            .finally(() => setSubmitting(false));
    };

    if (loading) return <Spinner centered />;
    if (!ticket) return <div>Ticket not found.</div>;

    return (
        <PageContentBlock title={t('tickets.ticket_details', 'Ticket Details')}>
            <div css={tw`flex items-center justify-between mb-8 pb-6 border-b border-neutral-800`}>
                <div css={tw`flex items-center gap-5`}>
                    <Link to={'/tickets'}>
                        <div css={tw`bg-neutral-800 hover:bg-neutral-700 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-lg`}>
                            <FontAwesomeIcon icon={faChevronLeft} css={tw`text-blue-400`} />
                        </div>
                    </Link>
                    <div>
                        <h1 css={tw`text-3xl font-header font-bold tracking-tight text-neutral-100`}>{ticket.subject}</h1>
                        <div css={tw`flex items-center gap-2 mt-1`}>
                            <span css={[
                                tw`px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-wider`,
                                ticket.status === 'open' ? tw`bg-green-500/10 text-green-400 border border-green-500/20` : tw`bg-neutral-500/10 text-neutral-400 border border-neutral-500/20`
                            ]}>
                                {t(`tickets.statuses.${ticket.status}`)}
                            </span>
                            <span css={tw`text-neutral-600`}>•</span>
                            <span css={tw`text-xs text-neutral-400 font-medium`}>
                                {t('tickets.priority')}: <span css={tw`text-neutral-200`}>{t(`tickets.priorities.${ticket.priority}`)}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div css={tw`bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col h-[600px]`}>
                <div ref={scrollRef} css={[
                    tw`flex-1 p-8 overflow-y-auto space-y-6`,
                    `&::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }`
                ]}>
                    {comments.map((comment) => (
                        <div key={comment.id} css={[
                            tw`flex flex-col`,
                            comment.is_admin ? tw`items-start ml-2` : tw`items-end mr-2`
                        ]}>
                            <div className={'group'} css={[
                                tw`relative max-w-[85%]`,
                                comment.is_admin ? tw`self-start` : tw`self-end`
                            ]}>
                                {comment.is_admin && (
                                    <div css={tw`flex items-center gap-2 mb-1.5 ml-1`}>
                                        <span css={tw`text-[11px] font-bold text-blue-400 uppercase tracking-wide`}>
                                            {t('tickets.support_team')}
                                        </span>
                                        <span css={tw`bg-blue-500/10 text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border border-blue-500/20`}>
                                            STAFF
                                        </span>
                                    </div>
                                )}

                                <div css={[
                                    tw`p-5 rounded-3xl text-sm shadow-xl transition-all duration-200`,
                                    comment.is_admin
                                        ? tw`bg-neutral-800 text-neutral-100 rounded-tl-none border border-neutral-700/50 hover:border-neutral-600`
                                        : tw`bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none shadow-lg border border-blue-500/30 hover:shadow-xl`
                                ]}>
                                    <p css={tw`leading-relaxed whitespace-pre-wrap whitespace-normal break-words`}>
                                        {comment.comment}
                                    </p>
                                </div>

                                <div css={[
                                    tw`flex items-center gap-2 mt-2 px-1 text-[10px] text-neutral-500 font-medium`,
                                    !comment.is_admin && tw`justify-end`
                                ]}>
                                    {!comment.is_admin && t('tickets.you')}
                                    <span>•</span>
                                    <span>{format(new Date(comment.created_at), 'MMM d, HH:mm')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {ticket.status !== 'closed' && (
                    <div css={tw`p-6 border-t border-neutral-800 bg-neutral-900 shadow-2xl rounded-b-xl`}>
                        <div css={tw`relative flex items-center`}>
                            <textarea
                                css={[
                                    tw`w-full bg-neutral-800 border-none focus:ring-2 focus:ring-blue-500/50 text-neutral-100 rounded-2xl p-4 pr-16 transition-all placeholder-neutral-500 text-sm`,
                                    tw`resize-none overflow-hidden min-h-[56px] max-h-[200px]`
                                ]}
                                value={message}
                                onChange={e => {
                                    setMessage(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder={t('tickets.type_message', 'Type your message...')}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onSendMessage();
                                    }
                                }}
                            />
                            <div css={tw`absolute right-2 flex items-center`}>
                                <button
                                    disabled={submitting || !message.trim()}
                                    onClick={onSendMessage}
                                    css={[
                                        tw`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-lg`,
                                        !message.trim() || submitting
                                            ? tw`bg-neutral-700 text-neutral-500 cursor-not-allowed`
                                            : tw`bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95`
                                    ]}
                                >
                                    {submitting ? (
                                        <div css={tw`w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin`} />
                                    ) : (
                                        <FontAwesomeIcon icon={faPaperPlane} css={tw`text-sm`} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageContentBlock>
    );
};

export default TicketChatContainer;
