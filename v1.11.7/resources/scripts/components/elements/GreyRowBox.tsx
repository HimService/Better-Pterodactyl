import React from 'react';
import styled from 'styled-components/macro';

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

import CopyOnClick from '@/components/elements/CopyOnClick';

// 1. 定義元件自身的 props，並使其成為泛型。
interface GreyRowBoxOwnProps<C extends React.ElementType> {
    icon?: React.ReactNode;
    title?: string;
    className?: string;
    $hoverable?: boolean;
    copyOnClick?: string;
    as?: C;
}

// 2. 透過結合自身 props 與底層元素的 props 來建立最終的 props 類型。
// 這裡使用 React.PropsWithChildren 來加入 `children` prop，並使用 Omit 來防止 prop 衝突。
type GreyRowBoxProps<C extends React.ElementType> = React.PropsWithChildren<GreyRowBoxOwnProps<C>> &
    Omit<React.ComponentPropsWithoutRef<C>, keyof GreyRowBoxOwnProps<C>>;

// 3. 使用泛型 props 實作元件。
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
    // 要渲染的元件將是 `as` prop 中傳入的元件，預設為 div。
    const Component = as || 'div';

    // `...props` 現在將正確地包含 `href` 等屬性（當 as="a" 時）。
    // 我們將這些 props 傳遞給 styled 的 `Container` 元件，
    // 該元件會 благодаря to its own `as` prop 渲染出正確的底層元素。
    return (
        <CopyOnClick text={copyOnClick}>
            <Container as={as as any} className={`grey-row-box ${className || ''}`} {...props}>
                {icon && <div className={'mr-4'}>{icon}</div>}
                <div className={'flex-1'}>
                    {title && <Title>{title}</Title>}
                    <Content>{children}</Content>
                </div>
            </Container>
        </CopyOnClick>
    );
};

export default GreyRowBox;
