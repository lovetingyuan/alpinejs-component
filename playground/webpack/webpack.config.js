const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { webpackPlugin: AlpineWebComponentPlugin } = require('unplugin-alpinejs-webcomponent')

const DEV = process.argv[2] === 'serve'

module.exports = {
  mode: DEV ? 'development' : 'production',
  entry: './src/main.js',
  output: {
    filename: '[name]-[contenthash].js',
    clean: true,
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.wasm'],
  },
  devtool: DEV ? 'inline-source-map' : 'source-map',
  devServer: {
    port: 3000,
    // open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: true,
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
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
    AlpineWebComponentPlugin(),
    new HtmlWebpackPlugin({
      title: 'Webpack App',
      filename: 'index.html',
      template: 'index.html',
      minify: false,
    }),
  ],
  stats: {
    children: true,
  },
}
