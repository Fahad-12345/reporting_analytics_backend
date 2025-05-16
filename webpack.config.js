const path = require('path');
const nodeExternals = require('webpack-node-externals');

const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const {
  NODE_ENVR = 'production',
} = process.env;

module.exports = {
  entry: './src/app.ts',
  mode: NODE_ENVR,
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'app.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          'ts-loader',
        ]
      }
    ]
  },
  externals: [ nodeExternals() ]
}