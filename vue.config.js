const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,

  // ✅ Allow Vue to handle routing (for /profile, /pay etc.)
  devServer: {
    historyApiFallback: true
  }
});
