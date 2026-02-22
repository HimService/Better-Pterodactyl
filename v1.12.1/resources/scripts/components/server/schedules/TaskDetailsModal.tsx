import React, { useContext, useEffect } from 'react';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import { Field as FormikField, Form, Formik, FormikHelpers, useField } from 'formik';
import { ServerContext } from '@/state/server';
import { useTranslation } from 'react-i18next';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import { httpErrorToHuman } from '@/api/http';
import Field from '@/components/elements/Field';
import FlashMessageRender from '@/components/FlashMessageRender';
import { boolean, number, object, string } from 'yup';
import useFlash from '@/plugins/useFlash';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import tw from 'twin.macro';
import Label from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Input';
import { Button } from '@/components/elements/button/index';
import Select from '@/components/elements/Select';
import ModalContext from '@/context/ModalContext';
import asModal, { AsModalProps } from '@/hoc/asModal';
import FormikSwitch from '@/components/elements/FormikSwitch';

interface Props {
    schedule: Schedule;
    // If a task is provided we can assume we're editing it. If not provided,
    // we are creating a new one.
    task?: Task;
}

interface Values {
    action: string;
    payload: string;
    timeOffset: string;
    continueOnFailure: boolean;
}

const schema = object().shape({
    action: string().required().oneOf(['command', 'power', 'backup']),
    payload: string().when('action', {
        is: (v) => v !== 'backup',
        then: string().required('A task payload must be provided.'),
        otherwise: string(),
    }),
    continueOnFailure: boolean(),
    timeOffset: number()
        .typeError('The time offset must be a valid number between 0 and 900.')
        .required('A time offset value must be provided.')
        .min(0, 'The time offset must be at least 0 seconds.')
        .max(900, 'The time offset must be less than 900 seconds.'),
});

const ActionListener = () => {
    const [{ value }, { initialValue: initialAction }] = useField<string>('action');
    const [, { initialValue: initialPayload }, { setValue, setTouched }] = useField<string>('payload');

    useEffect(() => {
        if (value !== initialAction) {
            setValue(value === 'power' ? 'start' : '');
            setTouched(false);
        } else {
            setValue(initialPayload || '');
            setTouched(false);
        }
    }, [value]);

    return null;
};

const TaskDetailsModal = ({ schedule, task }: Props) => {
    const { t } = useTranslation();
    const { dismiss } = useContext(ModalContext);
    const { clearFlashes, addError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:task');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:task');
        if (backupLimit === 0 && values.action === 'backup') {
            setSubmitting(false);
            addError({
                message: t('server.schedules.backup_limit_zero', "A backup task cannot be created when the server's backup limit is set to 0."),
                key: 'schedule:task',
            });
        } else {
            createOrUpdateScheduleTask(uuid, schedule.id, task?.id, values)
                .then((task) => {
                    let tasks = schedule.tasks.map((t) => (t.id === task.id ? task : t));
                    if (!schedule.tasks.find((t) => t.id === task.id)) {
                        tasks = [...tasks, task];
                    }

                    appendSchedule({ ...schedule, tasks });
                    dismiss();
                })
                .catch((error) => {
                    console.error(error);
                    setSubmitting(false);
                    addError({ message: httpErrorToHuman(error), key: 'schedule:task' });
                });
        }
    };

    return (
        <Formik
            onSubmit={submit}
            validationSchema={schema}
            initialValues={{
                action: task?.action || 'command',
                payload: task?.payload || '',
                timeOffset: task?.timeOffset.toString() || '0',
                continueOnFailure: task?.continueOnFailure || false,
            }}
        >
            {({ isSubmitting, values }) => (
                <Form css={tw`m-0`}>
                    <FlashMessageRender byKey={'schedule:task'} css={tw`mb-4`} />
                    <h2 css={tw`text-2xl mb-6`}>{task ? '編輯任務' : '建立任務'}</h2>
                    <div css={tw`flex`}>
                        <div css={tw`mr-2 w-1/3`}>
                            <Label>動作</Label>
                            <ActionListener />
                            <FormikFieldWrapper name={'action'}>
                                <FormikField as={Select} name={'action'}>
                                    <option value={'command'}>傳送指令</option>
                                    <option value={'power'}>傳送電源操作</option>
                                    <option value={'backup'}>建立備份</option>
                                </FormikField>
                            </FormikFieldWrapper>
                        </div>
                        <div css={tw`flex-1 ml-6`}>
                            <Field
                                name={'timeOffset'}
                                label={'時間偏移 (秒)'}
                                description={
                                    '執行此任務前在前一個任務完成後要等待的秒數。如果這是排程的第一個任務，將不會套用。'
                                }
                            />
                        </div>
                    </div>
                    <div css={tw`mt-6`}>
                        {values.action === 'command' ? (
                            <div>
                                <Label>內容 (Payload)</Label>
                                <FormikFieldWrapper name={'payload'}>
                                    <FormikField as={Textarea} name={'payload'} rows={6} />
                                </FormikFieldWrapper>
                            </div>
                        ) : values.action === 'power' ? (
                            <div>
                                <Label>內容 (Payload)</Label>
                                <FormikFieldWrapper name={'payload'}>
                                    <FormikField as={Select} name={'payload'}>
                                        <option value={'start'}>啟動伺服器</option>
                                        <option value={'restart'}>重新啟動伺服器</option>
                                        <option value={'stop'}>停止伺服器</option>
                                        <option value={'kill'}>強制停止伺服器</option>
                                    </FormikField>
                                </FormikFieldWrapper>
                            </div>
                        ) : (
                            <div>
                                <Label>忽略的檔案</Label>
                                <FormikFieldWrapper
                                    name={'payload'}
                                    description={
                                        '選填。要在此備份中排除的檔案和資料夾。預設情況下將使用您的 .pteroignore 檔案內容。如果達到備份上限，將輪替最舊的備份。'
                                    }
                                >
                                    <FormikField as={Textarea} name={'payload'} rows={6} />
                                </FormikFieldWrapper>
                            </div>
                        )}
                    </div>
                    <div css={tw`mt-6 p-4 rounded border shadow-inner bg-neutral-100 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-800 transition-colors duration-300`}>
                        <FormikSwitch
                            name={'continueOnFailure'}
                            description={'當此任務失敗時，未來的任務將繼續執行。'}
                            label={'失敗時繼續'}
                        />
                    </div>
                    <div css={tw`flex justify-end mt-6`}>
                        <Button type={'submit'} disabled={isSubmitting}>
                            {task ? '儲存變更' : '建立任務'}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

// Lazy wrapper：把 asModal 的呼叫延遲到 render 時，避免 webpack chunk 初始化順序問題
const LazyTaskDetailsModal = (props: Props & AsModalProps) => {
    const ModalRef = React.useRef<React.ComponentType<Props & AsModalProps> | null>(null);
    if (!ModalRef.current) {
        ModalRef.current = asModal<Props>()(TaskDetailsModal);
    }
    const WrappedModal = ModalRef.current;
    return <WrappedModal {...props} />;
};

export default LazyTaskDetailsModal;
