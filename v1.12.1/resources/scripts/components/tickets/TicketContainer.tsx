import React, { useEffect, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import GreyRowBox from '@/components/elements/GreyRowBox';
import Spinner from '@/components/elements/Spinner';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTicketAlt } from '@fortawesome/free-solid-svg-icons';

interface Ticket {
    id: number;
    subject: string;
    status: string;
    priority: string;
    category: string;
    created_at: string;
    updated_at: string;
}

const TicketContainer = () => {
    const { t } = useTranslation();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/client/tickets')
            .then(({ data }) => setTickets(data))
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
    }, []);

    return (
        <PageContentBlock title={t('tickets.header', 'Support Tickets')}>
            <div css={tw`flex items-center justify-between mb-6`}>
                <div>
                    <h1 css={tw`text-3xl font-header`}>{t('tickets.header', 'Support Tickets')}</h1>
                    <p css={tw`text-sm text-neutral-400`}>{t('tickets.description', 'Manage your support requests and technical inquiries.')}</p>
                </div>
                <Link to={'/tickets/new'}>
                    <Button>
                        <FontAwesomeIcon icon={faPlus} css={tw`mr-2`} />
                        {t('tickets.create', 'Create New Ticket')}
                    </Button>
                </Link>
            </div>

            {loading ? (
                <Spinner centered />
            ) : (
                <div css={tw`grid grid-cols-1 gap-4`}>
                    {tickets.length > 0 ? (
                        tickets.map((ticket) => (
                            <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                                <GreyRowBox css={tw`flex items-center justify-between`}>
                                    <div css={tw`flex items-center gap-4`}>
                                        <div css={tw`bg-neutral-800 p-3 rounded-lg text-neutral-400`}>
                                            <FontAwesomeIcon icon={faTicketAlt} size={'lg'} />
                                        </div>
                                        <div>
                                            <p css={tw`text-lg font-medium`}>{ticket.subject}</p>
                                            <p css={tw`text-xs text-neutral-400`}>
                                                #{ticket.id} • {ticket.category} • {format(new Date(ticket.updated_at), 'MMM do, yyyy HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    <div css={tw`flex items-center gap-4`}>
                                        <div css={[
                                            tw`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider`,
                                            ticket.status === 'open' ? tw`bg-green-500/10 text-green-500` :
                                                ticket.status === 'resolved' ? tw`bg-blue-500/10 text-blue-500` :
                                                    tw`bg-neutral-500/10 text-neutral-500`
                                        ]}>
                                            {t(`tickets.statuses.${ticket.status}`)}
                                        </div>
                                        <div css={[
                                            tw`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider`,
                                            ticket.priority === 'high' ? tw`bg-red-500/10 text-red-500` :
                                                ticket.priority === 'normal' ? tw`bg-yellow-500/10 text-yellow-500` :
                                                    tw`bg-blue-500/10 text-blue-500`
                                        ]}>
                                            {t(`tickets.priorities.${ticket.priority}`)}
                                        </div>
                                    </div>
                                </GreyRowBox>
                            </Link>
                        ))
                    ) : (
                        <div css={tw`text-center py-24 bg-neutral-900/50 rounded-xl border border-dashed border-neutral-700`}>
                            <p css={tw`text-neutral-400`}>{t('tickets.no_tickets', 'You have no tickets at the moment.')}</p>
                        </div>
                    )}
                </div>
            )}
        </PageContentBlock>
    );
};

export default TicketContainer;
