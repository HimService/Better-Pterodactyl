import React, { ElementType, ReactNode } from 'react';
import styled from 'styled-components/macro';
import CopyOnClick from '@/components/elements/CopyOnClick';

const Container = styled.div`
    border-radius: 8px;
    display: flex;
    align-items: center;
    padding: 1rem;
    margin-bottom: 0.5rem;
    border: 1px solid transparent;
`;

const Title = styled.p`
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-text);
    margin: 0;
`;

const Content = styled.div`
    font-weight: 600;
    font-size: 1.125rem;
    color: var(--color-heading);
`;

interface GreyRowBoxOwnProps<C extends ElementType = 'div'> {
    as?: C;
    title?: string;
    className?: string;
    icon?: ReactNode;
    copyOnClick?: string;
    $hoverable?: boolean;
    children?: ReactNode; // ✅ 解決 children: never
}

type GreyRowBoxProps<C extends React.ElementType> = GreyRowBoxOwnProps<C> &
    Omit<React.ComponentPropsWithoutRef<C>, keyof GreyRowBoxOwnProps<C>>;

const GreyRowBox = <C extends React.ElementType = 'div'>({
    icon,
    title,
    children,
    className,
    $hoverable = true,
    copyOnClick,
    as,
    ...props
}: GreyRowBoxProps<C>) => {
    const Component = as || 'div';

    return (
        <CopyOnClick text={copyOnClick}>
            <Container
                as={Component as any} // ✅ 關鍵：強制轉型避免 TS2769
                className={`grey-row-box ${className || ''}`}
                {...props}
            >
                {icon && <div className="mr-4">{icon}</div>}
                <div className="flex-1">
                    {title && <Title>{title}</Title>}
                    {children}
                </div>
            </Container>
        </CopyOnClick>
    );
};

export default GreyRowBox;
