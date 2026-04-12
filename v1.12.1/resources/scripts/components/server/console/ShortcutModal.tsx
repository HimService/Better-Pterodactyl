import React, { useState } from 'react';
import Modal from '@/components/elements/Modal';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Label from '@/components/elements/Label';
import Input from '@/components/elements/Input';
import { useTranslation } from 'react-i18next';

interface Props {
    visible: boolean;
    onDismissed: () => void;
    onSave: (label: string, command: string) => void;
}

const ShortcutModal = ({ visible, onDismissed, onSave }: Props) => {
    const { t } = useTranslation('frontend');
    const [label, setLabel] = useState('');
    const [command, setCommand] = useState('');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (label.trim() && command.trim()) {
            onSave(label.trim(), command.trim());
            setLabel('');
            setCommand('');
        }
    };

    return (
        <Modal visible={visible} onDismissed={onDismissed} top={true}>
            <form onSubmit={submit}>
                <h3 css={tw`text-2xl mb-6 text-neutral-100 font-bold font-sans`}>
                    {t('server.console.shortcuts.modal_title')}
                </h3>
                <div css={tw`mb-6 text-left`}>
                    <Label css={tw`mb-2 block`}>{t('server.console.shortcuts.label')}</Label>
                    <Input
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        placeholder={t('server.console.shortcuts.placeholder_label')}
                        autoFocus
                    />
                </div>
                <div css={tw`mb-8 text-left`}>
                    <Label css={tw`mb-2 block`}>{t('server.console.shortcuts.command')}</Label>
                    <Input
                        value={command}
                        onChange={e => setCommand(e.target.value)}
                        placeholder={t('server.console.shortcuts.placeholder_command')}
                    />
                </div>
                <div css={tw`flex justify-end gap-3`}>
                    <Button type={'button'} isSecondary onClick={onDismissed}>
                        {t('global.cancel')}
                    </Button>
                    <Button type={'submit'} disabled={!label.trim() || !command.trim()}>
                        {t('server.console.shortcuts.save')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ShortcutModal;
