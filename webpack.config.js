const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add rule for font files
  config.module.rules.push({
    test: /\.(woff|woff2|otf|ttf|eot)$/,
    loader: "file-loader",
    options: {
      name: "[name].[ext]",
      outputPath: "fonts/",
    },
  });

  return config;
};
