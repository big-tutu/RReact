const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use('/api', proxy({
    target: 'https://www.easy-mock.com/mock/5d5a6a33e460ca02cd97f97e/example',
		changeOrigin: true,
		pathRewrite: {
			'/api': '/'
		}
  }));
};