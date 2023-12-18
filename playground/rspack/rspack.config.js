const rspack = require('@rspack/core')
const refreshPlugin = require('@rspack/plugin-react-refresh')
const isDev = process.env.NODE_ENV === 'development'
const { rspackPlugin: AlpineWebComponentPlugin } = require('unplugin-alpinejs-webcomponent')

/**
 * @type {import('@rspack/cli').Configuration}
 */
module.exports = {
  context: __dirname,
  entry: {
    main: './src/main.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['@babel/plugin-transform-typescript'],
          },
        },
      },
    ],
  },
  plugins: [
    new rspack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new rspack.ProgressPlugin({}),
    new rspack.HtmlRspackPlugin({
      template: './index.html',
    }),
    AlpineWebComponentPlugin(),
    isDev ? new refreshPlugin() : null,
  ].filter(Boolean),
}
