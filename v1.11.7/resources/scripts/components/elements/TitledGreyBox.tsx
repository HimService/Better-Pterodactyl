import React, { memo } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import isEqual from 'react-fast-compare';

const Card = styled.div`
    background-color: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px var(--color-shadow), 0 2px 4px -1px var(--color-shadow);
    transition: all 0.2s ease-in-out;
`;

const CardHeader = styled.div`
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-card-border);
    display: flex;
    align-items: center;
    justify-content: space-between;

    & > p {
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-heading);
        margin: 0;
    }
`;

const CardBody = styled.div`
    padding: 1.5rem;
`;

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    suffix?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const TitledGreyBox = ({ icon, title, suffix, children, className }: Props) => (
    <Card className={className}>
        <CardHeader>
            {typeof title === 'string' ? (
                <p>
                    {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: '0.75rem', color: 'var(--color-text)' }} />}
                    {title}
                </p>
            ) : (
                title
            )}
            {suffix}
        </CardHeader>
        <CardBody>{children}</CardBody>
    </Card>
);

export default memo(TitledGreyBox, isEqual);
