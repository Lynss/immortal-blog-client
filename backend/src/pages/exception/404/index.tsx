import React, { useCallback } from 'react';
import { generateIcons, Navigator } from '@utils';
import { Button, Icon } from 'antd';

export const NotFound = () => {
    const backHome = useCallback(Navigator.goto.bind(null, '/index'), []);
    return (
        <div className={'not-found exception'}>
            <Icon component={generateIcons('not-found')} />
            <div className={'exception-text'}>
                <h1>404</h1>
                <p>Sorry, the page you visited does not exist</p>
                <Button onClick={backHome} type={'primary'}>
                    Back to home
                </Button>
            </div>
        </div>
    );
};
