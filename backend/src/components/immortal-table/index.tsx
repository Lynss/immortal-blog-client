import React, { useCallback, useEffect, useMemo } from 'react';
import { Button, Divider, message, Table } from 'antd';
import { each, get, isEmpty, map, uniqueId } from 'lodash';
import { ColumnProps, TableProps } from 'antd/lib/table';
import { useStore } from '@hooks';
import { observer } from 'mobx-react-lite';
import { TableStore } from '@stores';
import './index.scss';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import classnames from 'classnames';
import { IAuthChecker, IButtonProps, IFunction } from '@interfaces';
import { ImmortalButton } from '@components';
import { ButtonProps, ButtonType } from 'antd/lib/button';
import { interpolate } from '@utils';

const ACTION_CONFIG: ColumnProps<any> = {
    title: 'action',
    key: 'action',
    width: 200,
    align: 'center',
    fixed: 'right',
};

const ACTION_TYPE: ButtonType = 'link';

const DEFAULT_ACTION_PROPS = {
    type: ACTION_TYPE,
    className: 'table-action',
};

export interface IColumnProps<T> extends ColumnProps<T> {
    modifiable?: boolean;
    dynamicRender?: {
        display?: (text: any, record: T, index: number) => React.ReactNode;
        control?: (text: any, record: T, index: number) => React.ReactNode;
    };
    actions?: IButtonProps[];
}

interface IOperation extends IButtonProps {
    type?: 'batch' | 'normal';
}
export interface ITableProps<T> extends TableProps<T> {
    creatable?: IAuthChecker;
    modifiable?: IAuthChecker;
    deletable?: IAuthChecker;
    operations?: IOperation[];
    batchDeletable?: IAuthChecker;
    tableKey: string;
    columns: IColumnProps<T>[];
    form?: WrappedFormUtils;
    rowKey?: string;
    showSelection: boolean;
}

function getRowKey<T>(props: ITableProps<T>) {
    return props.rowKey || 'id';
}

function createConfirmActions<T>(table: TableStore<T>, form: WrappedFormUtils) {
    return [
        {
            button: {
                ...DEFAULT_ACTION_PROPS,
                text: 'confirm',
            },
            action: (_: any, record: T) => {
                const successAction = () => {
                    message.success('Operate successfully');
                    table.cancelChange();
                    form.resetFields();
                    table.fetchData();
                };
                table.confirmAction(successAction, undefined, value => ({
                    ...value,
                    id: get(record, 'id'),
                }));
            },
        },
        {
            button: {
                ...DEFAULT_ACTION_PROPS,
                text: 'cancel',
            },
            confirm: {
                title: 'Sure to give up',
            },
            action: () => {
                table.cancelChange();
                form.resetFields();
            },
        },
    ];
}

function createModifyAction<T>(table: TableStore<T>, auth: IAuthChecker) {
    return {
        auth,
        button: {
            ...DEFAULT_ACTION_PROPS,
            text: 'modify',
        },
        disabled: table.isChanging,
        action: (_: any, record: T, index: number, disabled?: boolean) => {
            if (!!disabled) {
                return;
            }
            table.change({
                type: 'modifying',
                record: {
                    ...record,
                },
            });
        },
    };
}

function createDeleteAction<T>(table: TableStore<T>, auth: IAuthChecker) {
    return {
        auth,
        button: {
            ...DEFAULT_ACTION_PROPS,
            text: 'delete',
        },
        disabled: table.isChanging,
        confirm: {
            title: 'Sure to delete',
        },
        action: (_: any, record: T, index: number, disabled?: boolean) => {
            if (!!disabled) {
                return;
            }
            table.delete([get(record, 'id')]);
        },
    };
}

function renderActionColumn<T>(
    actions: IButtonProps[] = [],
    table: TableStore<T>,
    form: WrappedFormUtils,
    rowKey: string,
    modifiable?: IAuthChecker,
    deletable?: IAuthChecker,
) {
    return (text: any, record: T) => {
        let newActions = [...actions];
        if (
            table.changing &&
            modifiable &&
            get(table, `changing.record.${rowKey}`) === get(record, rowKey)
        ) {
            newActions = createConfirmActions(table, form);
        } else {
            if (modifiable) {
                newActions.push(createModifyAction(table, modifiable));
            }
            if (deletable) {
                newActions.push(createDeleteAction(table, deletable));
            }
        }
        return (
            <div className={'table-actions'}>
                {map(newActions, (action, index) => {
                    let actionProps = {
                        ...action,
                    };
                    if (actionProps.action) {
                        actionProps.action = actionProps.action.bind(
                            null,
                            text,
                            record,
                            index,
                            action.disabled,
                        );
                    }
                    if (actionProps.button.href) {
                        actionProps.button.href = interpolate(
                            actionProps.button.href,
                            record,
                        );
                    }
                    if (actionProps.auth) {
                        if (actionProps.auth.requireUser) {
                            actionProps.auth.requireUser = interpolate(
                                actionProps.auth.requireUser,
                                record,
                            );
                        }
                        const button: ButtonProps = {
                            disabled: true,
                            type: 'link',
                            className: 'no-auth table-action disabled',
                        };
                        actionProps.auth.fallback = (
                            <Button {...button}>forbidden</Button>
                        );
                    }
                    actionProps.button.className = classnames(
                        actionProps.button.className,
                        'table-action',
                    );
                    return (
                        <span key={index}>
                            <ImmortalButton {...actionProps} />
                            {newActions.length - 1 !== index && (
                                <Divider type='vertical' />
                            )}
                        </span>
                    );
                })}
            </div>
        );
    };
}

function renderColumn<T>(
    column: IColumnProps<T>,
    showControl: boolean,
): IFunction {
    //Case changing
    if (showControl) {
        if (typeof get(column, 'dynamicRender.control') === 'undefined') {
            throw new Error(
                `${column.title} need dynamicRender.control property`,
            );
        }
        //@ts-ignore
        return column.dynamicRender.control;
    }
    const defaultRender = (value: any) => value;
    //Case normal
    return (
        (column.dynamicRender && column.dynamicRender.display) ||
        column.render ||
        defaultRender
    );
}

function transformColumns<T>(props: ITableProps<T>, table: TableStore<T>) {
    let columns: ColumnProps<T>[] = [];
    let actionColumn: ColumnProps<T> = {
        ...ACTION_CONFIG,
    };
    let actions: IButtonProps[] = [];
    let rowKey = getRowKey(props);
    each(props.columns, column => {
        //action column
        if (column.key === 'action') {
            actionColumn = {
                ...actionColumn,
                ...column,
            };
            if (column.actions) {
                actions = actions.concat(column.actions);
            }
        } else {
            let tempColumn: ColumnProps<T> = {
                ...column,
                render: (value, record, index) => {
                    let renderFunction = renderColumn(
                        column,
                        !!column.modifiable &&
                            get(record, rowKey) ===
                                get(table, `changing.record.${rowKey}`),
                    );
                    return renderFunction(value, record, index);
                },
                align: 'center',
            };
            if (table.sortInfo) {
                tempColumn.sortOrder =
                    get(table.sortInfo, 'field') === column.dataIndex &&
                    get(table.sortInfo, 'order');
            }
            columns.push(tempColumn);
        }
    });
    if (actions.length || props.modifiable || props.deletable) {
        actionColumn.render = renderActionColumn(
            actions,
            table,
            props.form as WrappedFormUtils,
            rowKey,
            props.modifiable,
            props.deletable,
        );
        columns.push(actionColumn);
    }
    return columns;
}

function Inner<T>(props: ITableProps<T>) {
    const {
        tables: { [props.tableKey]: table },
    } = useStore(['tables']);
    //transform columns
    const columns = transformColumns(props, table);
    //show row selection?
    const rowSelection = props.showSelection
        ? {
              selectedRowKeys: table.selectedRowKeys,
              onChange: table.onSelectChange.bind(table),
          }
        : undefined;
    //add operations
    const operations = props.operations || [];
    const operationLoading = table.loading && !table.isChanging;
    //get datasource
    const datasource = useMemo(() => {
        return !!props.creatable ? table.datasource : table.data;
    }, [props.creatable, table.datasource, table.data]);
    //transform props
    const transformProps = {
        ...props,
        columns,
        rowSelection,
        bordered: true,
        rowKey: getRowKey(props),
        onChange: table.onChange.bind(table),
        loading: table.loading,
        pagination: table.pagination,
        dataSource: datasource,
        className: classnames('table', props.className),
    };
    //create operation
    const onCreate = useCallback(() => {
        table.change({
            type: 'creating',
            record: {
                id: uniqueId('immortal-create-temp-id'),
            },
        });
        // eslint-disable-next-line
    }, []);

    //batch delete operation
    const isEmptySelected = useMemo(() => isEmpty(table.selectedRowKeys), [
        table.selectedRowKeys,
    ]);
    const onBatchDelete = useCallback(() => {
        if (table.isChanging) {
            return;
        }
        if (isEmptySelected) {
            message.warn('You should select at least one row');
            return;
        }
        table.delete(table.selectedRowKeys);
        // eslint-disable-next-line
    }, [isEmptySelected, table.isChanging, table.selectedRowKeys]);

    //fetch data in the initial
    useEffect(() => {
        table.fetchData();
        // eslint-disable-next-line
    }, []);
    return (
        <div className={'immortal-table'}>
            <div className={'operations'}>
                {props.creatable && (
                    <ImmortalButton
                        auth={props.creatable}
                        button={{
                            loading: operationLoading,
                            tip: {
                                title: 'Create',
                            },
                            icon: 'plus',
                            type: 'primary',
                            className: 'operation create-button',
                        }}
                        disabled={table.isChanging}
                        action={onCreate}
                    />
                )}
                {map(operations, (operation, index) => {
                    if (operation.type === 'batch') {
                        operation.button.loading =
                            operationLoading && !isEmptySelected;
                        operation.disabled =
                            table.isChanging || isEmptySelected;
                    } else {
                        operation.button.loading = operationLoading;
                        operation.disabled = table.isChanging;
                    }
                    return <ImmortalButton key={index} {...operation} />;
                })}
                {props.batchDeletable && (
                    <ImmortalButton
                        auth={props.batchDeletable}
                        button={{
                            loading: operationLoading && !isEmptySelected,
                            tip: {
                                title: 'Batch Delete',
                            },
                            icon: 'delete',
                            className: 'operation delete-button',
                        }}
                        disabled={table.isChanging || isEmptySelected}
                        action={onBatchDelete}
                        confirm={{
                            placement: 'topRight',
                            title: 'Sure to execute batch delete',
                        }}
                    />
                )}
            </div>
            <Table {...transformProps} />
        </div>
    );
}

const ImmortalTable = observer(Inner);

export default ImmortalTable;
