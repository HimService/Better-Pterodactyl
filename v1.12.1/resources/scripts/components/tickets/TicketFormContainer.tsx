import React, { useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import { Formik, Form, Field as FormikField, FieldProps, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import * as Yup from 'yup';

interface CreateTicketValues {
    subject: string;
    priority: string;
    category: string;
    content: string;
}

const TicketFormContainer = () => {
    const { t } = useTranslation();
    const history = useHistory();

    const submit = (values: CreateTicketValues, { setSubmitting }: FormikHelpers<CreateTicketValues>) => {
        axios.post('/api/client/tickets', values)
            .then(({ data }) => history.push(`/tickets/${data.id}`))
            .catch(error => {
                setSubmitting(false);
                console.error(error);

                let message = t('tickets.errors.create_failed');
                if (error.response?.data?.errors?.[0]?.detail) {
                    message = error.response.data.errors[0].detail;
                } else if (error.response?.data?.error) {
                    message = error.response.data.error;
                }

                // @ts-ignore
                if (window.swal) {
                    // @ts-ignore
                    window.swal.fire({
                        title: t('common.error'),
                        text: message,
                        icon: 'error',
                        confirmButtonColor: '#3b82f6',
                    });
                } else {
                    alert(message);
                }
            });
    };

    return (
        <PageContentBlock title={t('tickets.create_header', 'Create Support Ticket')}>
            <div css={tw`max-w-3xl mx-auto`}>
                <h1 css={tw`text-3xl font-header mb-2`}>{t('tickets.create_header', 'Create Support Ticket')}</h1>
                <p css={tw`text-sm text-neutral-400 mb-8`}>{t('tickets.create_description', 'Please provide detailed information so we can assist you better.')}</p>

                <Formik
                    initialValues={{ subject: '', priority: 'normal', category: 'General Support', content: '' }}
                    validationSchema={Yup.object().shape({
                        subject: Yup.string().required(t('tickets.validation.subject_required')).min(3, t('tickets.validation.subject_min', { min: 3 })).max(191, t('tickets.validation.subject_max', { max: 191 })),
                        content: Yup.string().required(t('tickets.validation.content_required')).min(10, t('tickets.validation.content_min', { min: 10 })),
                    })}
                    onSubmit={submit}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div css={tw`grid grid-cols-1 md:grid-cols-2 gap-6 mb-6`}>
                                <Field
                                    name="subject"
                                    label={t('tickets.subject')}
                                    placeholder={t('tickets.subject')}
                                />
                                <div css={tw`grid grid-cols-2 gap-4`}>
                                    <div>
                                        <Label>{t('tickets.priority')}</Label>
                                        <FormikField name="priority" as={Select}>
                                            <option value="low">{t('tickets.priorities.low')}</option>
                                            <option value="normal">{t('tickets.priorities.normal')}</option>
                                            <option value="high">{t('tickets.priorities.high')}</option>
                                        </FormikField>
                                    </div>
                                    <div>
                                        <Label>{t('tickets.category')}</Label>
                                        <FormikField name="category" as={Select}>
                                            <option value="General Support">{t('tickets.category')} - General</option>
                                            <option value="Technical Issue">{t('tickets.category')} - Technical</option>
                                            <option value="Billing">{t('tickets.category')} - Billing</option>
                                            <option value="Report">{t('tickets.category')} - Report</option>
                                        </FormikField>
                                    </div>
                                </div>
                            </div>

                            <div css={tw`mb-8`}>
                                <Label>{t('tickets.message')}</Label>
                                <FormikField name="content">
                                    {({ field, form: { errors, touched } }: FieldProps) => (
                                        <div>
                                            <textarea
                                                {...field}
                                                rows={8}
                                                css={[
                                                    tw`w-full bg-neutral-900/40 border-neutral-800 border rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-300 shadow-inner`,
                                                    touched.content && errors.content ? tw`border-red-500` : tw`hover:border-neutral-700`
                                                ]}
                                                placeholder={t('tickets.type_message')}
                                            />
                                            {touched.content && errors.content && (
                                                <p css={tw`text-xs text-red-400 mt-2 font-medium`}>{errors.content as string}</p>
                                            )}
                                        </div>
                                    )}
                                </FormikField>
                            </div>

                            <div css={tw`flex justify-end gap-3`}>
                                <Button isSecondary type="button" onClick={() => history.goBack()}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" isLoading={isSubmitting}>
                                    {t('tickets.submit', 'Submit Ticket')}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </PageContentBlock>
    );
};

export default TicketFormContainer;
