import React, { createRef } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Fade from '@/components/elements/Fade';
import Portal from '@/components/elements/Portal';

interface Props {
    children: React.ReactNode;
    renderToggle: (onClick: (e: React.MouseEvent<any, MouseEvent>) => void) => React.ReactChild;
}

export const DropdownButtonRow = styled.button<{ danger?: boolean }>`
    ${tw`p-2 flex items-center rounded w-full text-neutral-500`};
    transition: 150ms all ease;

    &:hover {
        ${(props) => (props.danger ? tw`text-red-700 bg-red-100` : tw`text-neutral-700 bg-neutral-100`)};
    }
`;

interface State {
    posX: number;
    posY: number;
    visible: boolean;
}

class DropdownMenu extends React.PureComponent<Props, State> {
    menu = createRef<HTMLDivElement>();

    state: State = {
        posX: 0,
        posY: 0,
        visible: false,
    };

    componentWillUnmount() {
        this.removeListeners();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        const menu = this.menu.current;

        if (this.state.visible && !prevState.visible && menu) {
            document.addEventListener('click', this.windowListener);
            document.addEventListener('contextmenu', this.contextMenuListener);
            
            // 由於元件在 Portal 中採用 fixed 定位，因此直接使用滑鼠在全螢幕的座標即可
            menu.style.left = `${Math.round(this.state.posX - menu.clientWidth)}px`;
            // 若預設向下延伸
            menu.style.top = `${Math.round(this.state.posY)}px`;
            
            window.requestAnimationFrame(() => {
                if (!this.menu.current) return;
                const m = this.menu.current;
                const rect = m.getBoundingClientRect();
                
                // 如果底部超過螢幕邊界，則直接改從滑鼠點擊位置往上方展開
                if (rect.bottom > window.innerHeight) {
                    m.style.top = `${Math.round(this.state.posY - m.clientHeight)}px`;
                }
                
                // 防呆：如果右鍵菜單被擠出螢幕左側
                if (rect.left < 0) {
                    m.style.left = `${Math.round(this.state.posX)}px`;
                }
            });
        }

        if (!this.state.visible && prevState.visible) {
            this.removeListeners();
        }
    }

    removeListeners = () => {
        document.removeEventListener('click', this.windowListener);
        document.removeEventListener('contextmenu', this.contextMenuListener);
    };

    onClickHandler = (e: React.MouseEvent<any, MouseEvent>) => {
        e.preventDefault();
        this.triggerMenu(e.clientX, e.clientY);
    };

    contextMenuListener = () => this.setState({ visible: false });

    windowListener = (e: MouseEvent) => {
        const menu = this.menu.current;

        if (e.button === 2 || !this.state.visible || !menu) {
            return;
        }

        if (e.target === menu || menu.contains(e.target as Node)) {
            return;
        }

        if (e.target !== menu && !menu.contains(e.target as Node)) {
            this.setState({ visible: false });
        }
    };

    triggerMenu = (posX: number, posY: number) =>
        this.setState((s) => ({
            posX: !s.visible ? posX : s.posX,
            posY: !s.visible ? posY : s.posY,
            visible: !s.visible,
        }));

    render() {
        return (
            <div>
                {this.props.renderToggle(this.onClickHandler)}
                <Portal>
                    <Fade timeout={150} in={this.state.visible} unmountOnExit>
                        <div
                            ref={this.menu}
                            onClick={(e) => {
                                e.stopPropagation();
                                this.setState({ visible: false });
                            }}
                            style={{ width: '12rem' }}
                            css={tw`fixed bg-white p-2 rounded border border-neutral-700 shadow-lg text-neutral-500 z-50`}
                        >
                            {this.props.children}
                        </div>
                    </Fade>
                </Portal>
            </div>
        );
    }
}

export default DropdownMenu;
