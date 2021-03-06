const { override, fixBabelImports, addWebpackAlias } = require('customize-cra');
const path = require('path');
const rewireSvgReactLoader = require('react-app-rewire-svg-react-loader');

module.exports = override(
    fixBabelImports('antd', {
        libraryDirectory: 'es',
        style: 'css',
    }),
    fixBabelImports('lodash', {
        libraryDirectory: '',
        camel2DashComponentName: false, // default: true
    }),
    addWebpackAlias({
        '@pages': path.resolve('src/pages'),
        '@components': path.resolve('src/components'),
        '@configs': path.resolve('src/configs'),
        '@utils': path.resolve('src/utils'),
        '@stores': path.resolve('src/stores'),
        '@models': path.resolve('src/models'),
        '@interfaces': path.resolve('src/interfaces'),
        '@assets': path.resolve('src/assets'),
        '@apis': path.resolve('src/apis'),
        '@router': path.resolve('src/router'),
        '@context': path.resolve('src/context'),
        '@hooks': path.resolve('src/hooks'),
    }),
    rewireSvgReactLoader,
);
