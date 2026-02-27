import React, { useEffect, useState } from 'react';
import Fade from '@/components/elements/Fade';
import Portal from '@/components/elements/Portal';
import copy from 'copy-to-clipboard';
import classNames from 'classnames';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from 'react-i18next';

interface CopyOnClickProps {
    text: string | number | null | undefined;
    showInNotification?: boolean;
    children: React.ReactNode;
}

const NotificationContainer = styled.div`
    ${tw`fixed z-50 bottom-0 right-0 m-6 pointer-events-none`};
`;

const NotificationContent = styled.div`
    ${tw`flex items-center gap-3 rounded-2xl py-3 px-5 shadow-2xl backdrop-blur-xl border transition-all duration-300`};
    background-color: rgba(var(--bg-card), 0.85);
    border-color: rgba(var(--border-color), 0.5);
    color: rgb(var(--text-primary));
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.3);
    
    .icon {
        color: #10b981;
        ${tw`text-lg`};
    }
    
    p {
        ${tw`text-sm font-medium m-0 tracking-tight`};
        color: rgb(var(--text-primary));
    }
`;

const CopyOnClick = ({ text, showInNotification = true, children }: CopyOnClickProps) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;

        const timeout = setTimeout(() => {
            setCopied(false);
        }, 2500);

        return () => {
            clearTimeout(timeout);
        };
    }, [copied]);

    if (!React.isValidElement(children)) {
        throw new Error('Component passed to <CopyOnClick/> must be a valid React element.');
    }

    const child = !text
        ? React.Children.only(children)
        : React.cloneElement(React.Children.only(children), {
            // @ts-expect-error todo: check on this
            className: classNames(children.props.className || '', 'cursor-pointer'),
            onClick: (e: React.MouseEvent<HTMLElement>) => {
                copy(String(text));
                setCopied(true);
                if (typeof children.props.onClick === 'function') {
                    children.props.onClick(e);
                }
            },
        });

    return (
        <>
            {copied && (
                <Portal>
                    <Fade in appear timeout={250} key={copied ? 'visible' : 'invisible'}>
                        <NotificationContainer>
                            <NotificationContent>
                                <FontAwesomeIcon icon={faCheckCircle} className={'icon'} />
                                <p>
                                    {showInNotification
                                        ? t('global.copied_with_text', { text: String(text) })
                                        : t('global.copied')}
                                </p>
                            </NotificationContent>
                        </NotificationContainer>
                    </Fade>
                </Portal>
            )}
            {child}
        </>
    );
};

export default CopyOnClick;
