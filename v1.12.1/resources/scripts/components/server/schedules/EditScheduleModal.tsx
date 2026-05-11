import React, { useContext, useEffect, useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import Field from '@/components/elements/Field';
import { Form, Formik, FormikHelpers } from 'formik';
import FormikSwitch from '@/components/elements/FormikSwitch';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import Switch from '@/components/elements/Switch';
import ScheduleCheatsheetCards from '@/components/server/schedules/ScheduleCheatsheetCards';
import { useTranslation } from 'react-i18next';
import getScheduleConditions, { ScheduleCondition } from '@/api/server/schedules/getScheduleConditions';
import updateScheduleConditions from '@/api/server/schedules/updateScheduleConditions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faRobot } from '@fortawesome/free-solid-svg-icons';
import Select from '@/components/elements/Select';

interface Props {
    schedule?: Schedule;
}

interface Values {
    name: string;
    dayOfWeek: string;
    month: string;
    dayOfMonth: string;
    hour: string;
    minute: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
}

const EditScheduleModal = ({ schedule }: Props) => {
    const { t } = useTranslation();
    const { addError, clearFlashes } = useFlash();
    const { dismiss } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const [showCheatsheet, setShowCheetsheet] = useState(false);

    const [conditions, setConditions] = useState<ScheduleCondition[]>([]);
    const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>('AND');

    useEffect(() => {
        if (schedule) {
            getScheduleConditions(uuid, schedule.id)
                .then(data => {
                    setConditions(data.conditions);
                    setLogicOperator(data.logic_operator);
                })
                .catch(err => console.error('Failed to fetch schedule conditions:', err));
        }

        return () => {
            clearFlashes('schedule:edit');
        };
    }, [schedule]);

    const addCondition = () => {
        setConditions([...conditions, { variable: 'cpu_usage', operator: '==', value: 0 }]);
    };

    const removeCondition = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const updateCondition = (index: number, key: keyof ScheduleCondition, value: any) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [key]: value };
        setConditions(newConditions);
    };

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:edit');
        createOrUpdateSchedule(uuid, {
            id: schedule?.id,
            name: values.name,
            cron: {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            },
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then(async (newSchedule) => {
                await updateScheduleConditions(uuid, newSchedule.id, conditions, logicOperator);
                return newSchedule;
            })
            .then((schedule) => {
                setSubmitting(false);
                appendSchedule(schedule);
                dismiss();
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addError({ key: 'schedule:edit', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    name: schedule?.name || '',
                    minute: schedule?.cron.minute || '*/5',
                    hour: schedule?.cron.hour || '*',
                    dayOfMonth: schedule?.cron.dayOfMonth || '*',
                    month: schedule?.cron.month || '*',
                    dayOfWeek: schedule?.cron.dayOfWeek || '*',
                    enabled: schedule?.isActive ?? true,
                    onlyWhenOnline: schedule?.onlyWhenOnline ?? true,
                } as Values
            }
        >
            {({ isSubmitting }) => (
                <Form>
                    <h3 css={tw`text-2xl mb-6`}>{schedule ? t('server.schedules.edit_title', 'Edit schedule') : t('server.schedules.create_title', 'Create new schedule')}</h3>
                    <FlashMessageRender byKey={'schedule:edit'} css={tw`mb-6`} />
                    <Field
                        name={'name'}
                        label={t('server.schedules.name_label', 'Schedule name')}
                        description={t('server.schedules.name_description', 'A human readable identifier for this schedule.')}
                    />
                    <div css={tw`grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6`}>
                        <Field name={'minute'} label={t('server.schedules.cron_minute', 'Minute')} />
                        <Field name={'hour'} label={t('server.schedules.cron_hour', 'Hour')} />
                        <Field name={'dayOfMonth'} label={t('server.schedules.cron_dom', 'Day of month')} />
                        <Field name={'month'} label={t('server.schedules.cron_month', 'Month')} />
                        <Field name={'dayOfWeek'} label={t('server.schedules.cron_dow', 'Day of week')} />
                    </div>
                    <p css={tw`text-neutral-400 text-xs mt-2`}>
                        {t('server.schedules.cron_description', 'The schedule system supports the use of Cronjob syntax when defining when tasks should begin running. Use the fields above to specify when these tasks should begin running.')}
                    </p>
                    <div css={tw`mt-6 p-4 rounded border shadow-inner bg-neutral-100 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-800 transition-colors duration-300`}>
                        <Switch
                            name={'show_cheatsheet'}
                            description={t('server.schedules.cheatsheet_description', 'Show the cron cheatsheet for some examples.')}
                            label={t('server.schedules.cheatsheet_label', 'Show Cheatsheet')}
                            defaultChecked={showCheatsheet}
                            onChange={() => setShowCheetsheet((s) => !s)}
                        />
                        {showCheatsheet && (
                            <div css={tw`block md:flex w-full`}>
                                <ScheduleCheatsheetCards />
                            </div>
                        )}
                    </div>
                    <div css={tw`mt-6 p-4 rounded border shadow-inner bg-neutral-100 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-800 transition-colors duration-300`}>
                        <FormikSwitch
                            name={'onlyWhenOnline'}
                            description={t('server.schedules.only_online_description', 'Only execute this schedule when the server is in a running state.')}
                            label={t('server.schedules.only_online_label', 'Only When Server Is Online')}
                        />
                    </div>
                    <div css={tw`mt-6 p-4 rounded border shadow-inner bg-neutral-100 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-800 transition-colors duration-300`}>
                        <FormikSwitch
                            name={'enabled'}
                            description={t('server.schedules.enabled_description', 'This schedule will be executed automatically if enabled.')}
                            label={t('server.schedules.enabled_label', 'Schedule Enabled')}
                        />
                    </div>

                    <div css={tw`mt-6 p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-md`}>
                        <div css={tw`flex items-center justify-between mb-4`}>
                            <div css={tw`flex items-center gap-3`}>
                                <div css={tw`p-2 rounded-lg bg-purple-500 bg-opacity-10 text-purple-400`}>
                                    <FontAwesomeIcon icon={faRobot} />
                                </div>
                                <div>
                                    <h4 css={tw`text-neutral-100 font-bold`}>{t('server.schedules.conditions_header', 'Smart Conditions')}</h4>
                                    <p css={tw`text-xs text-neutral-400`}>{t('server.schedules.conditions_description', 'Only execute if these conditions are met.')}</p>
                                </div>
                            </div>
                            <Button.Text type={'button'} css={tw`text-xs px-3 py-1!`} onClick={addCondition}>
                                <FontAwesomeIcon icon={faPlus} css={tw`mr-2`} />
                                {t('server.schedules.add_condition', 'Add')}
                            </Button.Text>
                        </div>

                        {conditions.length > 0 && (
                            <div css={tw`space-y-3`}>
                                <div css={tw`flex items-center gap-4 mb-4`}>
                                    <span css={tw`text-xs text-neutral-400 uppercase font-bold tracking-wider`}>Logic Operator</span>
                                    <div css={tw`flex gap-2`}>
                                        {['AND', 'OR'].map(op => (
                                            <button
                                                key={op}
                                                type="button"
                                                onClick={() => setLogicOperator(op as any)}
                                                css={[
                                                    tw`px-3 py-1 rounded-md text-xs font-bold transition-all`,
                                                    logicOperator === op ? tw`bg-purple-600 text-white shadow-lg` : tw`bg-neutral-800 text-neutral-400 hover:bg-neutral-700`
                                                ]}
                                            >
                                                {t(`server.schedules.logic_${op.toLowerCase()}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {conditions.map((condition, index) => (
                                    <div key={index} className="group" css={tw`flex items-center gap-3 bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50`}>
                                        <div css={tw`flex-1 grid grid-cols-3 gap-3`}>
                                            <Select
                                                value={condition.variable}
                                                onChange={e => updateCondition(index, 'variable', e.target.value)}
                                                css={tw`bg-neutral-900! border-neutral-700! text-sm!`}
                                            >
                                                <option value="cpu_usage">{t('server.schedules.var_cpu')}</option>
                                                <option value="memory_usage">{t('server.schedules.var_memory')}</option>
                                                <option value="uptime">{t('server.schedules.var_uptime')}</option>
                                            </Select>
                                            <Select
                                                value={condition.operator}
                                                onChange={e => updateCondition(index, 'operator', e.target.value)}
                                                css={tw`bg-neutral-900! border-neutral-700! text-sm! font-mono!`}
                                            >
                                                <option value="==">==</option>
                                                <option value="!=">!=</option>
                                                <option value=">">&gt;</option>
                                                <option value="<">&lt;</option>
                                                <option value=">=">&gt;=</option>
                                                <option value="<=">&lt;=</option>
                                            </Select>
                                            <input
                                                type="number"
                                                value={condition.value}
                                                onChange={e => updateCondition(index, 'value', Number(e.target.value))}
                                                css={tw`w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-purple-500 transition-colors`}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeCondition(index)}
                                            css={tw`p-2 text-neutral-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100`}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div css={tw`mt-6 text-right`}>
                        <Button className={'w-full sm:w-auto'} type={'submit'} disabled={isSubmitting}>
                            {schedule ? t('server.schedules.save_changes', 'Save changes') : t('server.schedules.create_schedule', 'Create schedule')}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

const LazyEditScheduleModal = (props: Props & import('@/hoc/asModal').AsModalProps) => {
    const ModalRef = React.useRef<React.ComponentType<Props & import('@/hoc/asModal').AsModalProps> | null>(null);
    if (!ModalRef.current) {
        ModalRef.current = asModal<Props>()(EditScheduleModal);
    }
    const WrappedModal = ModalRef.current;
    return <WrappedModal {...props} />;
};

export default LazyEditScheduleModal;
