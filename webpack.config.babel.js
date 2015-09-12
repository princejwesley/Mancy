import path from 'path';
import webpack from 'webpack';

const ROOT_PATH = path.resolve(__dirname, 'src');

module.exports = {
  entry: {
    app: [ 'webpack/hot/only-dev-server', path.resolve(ROOT_PATH, 'components/main.jsx') ]
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true
  },
  output: {
    path: __dirname,
    filename: 'node-repl-plus.js'
  },
  module: {
    loaders: [
      {
        test: /\.scss$/,
        loader: 'style!css!sass',
        include: path.resolve(__dirname, 'stylesheets')
      },
      {
        test: /\.jsx?$/,
        loaders: ['react-hot', 'babel'],
        include: ROOT_PATH,
        exclude: path.resolve(ROOT_PATH, 'main')
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
};
