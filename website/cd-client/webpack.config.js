const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');

module.exports = {
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['javascript', 'typescript', 'json'],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        include: path.resolve(__dirname, 'node_modules/monaco-editor'),
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    fallback: {
      fs: false,
      path: false,
    },
  }
};