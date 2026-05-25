const path = require("path");

module.exports = {
  name: "hub",
  entry: "./src/hub/index.tsx",
  output: {
    filename: "hub.js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  performance: { hints: false },
  devServer: {
    static: path.resolve(__dirname, "dist"),
    port: 3000,
    server: "https",
    headers: { "Access-Control-Allow-Origin": "*" },
    hot: true,
  },
};
