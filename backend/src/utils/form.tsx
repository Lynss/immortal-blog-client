import { each } from 'lodash';
import { Form as AntForm, Icon } from 'antd';
import { AnyObject } from '@interfaces';
import { getStore } from '@stores';
import React, { ComponentType, PureComponent, Suspense } from 'react';
import { WrappedFormUtils } from 'antd/lib/form/Form';

//Provide a easier way to create a form
async function createForm<T extends ComponentType<any>>(
    Form: T,
    formKey: string,
    initFields: () => Promise<AnyObject>,
) {
    const store = getStore();
    await store.createFormStore(formKey, initFields);
    // await new Promise(resolve => setTimeout(resolve, 10000));
    const formStore = store.forms[formKey];
    const WrapperForm = AntForm.create({
        mapPropsToFields() {
            let formFields: AnyObject = {};
            each(formStore.fields, (field, key) => {
                formFields[key] = AntForm.createFormField(field);
            });
            return formFields;
        },
        onFieldsChange(_, changedFields) {
            formStore.onFieldsChange(changedFields);
        },
        onValuesChange(_, changedValues) {
            formStore.onValuesChange(changedValues);
        },
    })(Form);

    const createRef = (ref: WrappedFormUtils) => {
        formStore.form = ref;
    };

    return {
        // @ts-ignore
        default: props => <WrapperForm ref={createRef} {...props} />,
    };
}

export function createLazyForm<T extends ComponentType<any>>(
    Form: T,
    formKey: string,
    initFields: () => Promise<AnyObject>,
) {
    const LazyForm = React.lazy(() => createForm(Form, formKey, initFields));
    return class SuspenseForm extends PureComponent<any> {
        render() {
            return (
                <Suspense fallback={<Icon type={'loading'} />}>
                    <LazyForm />
                </Suspense>
            );
        }
    };
}
