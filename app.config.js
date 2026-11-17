// WEB_BASE_URL (e.g. "/butcem-net") is set only when exporting for a sub-path host like GitHub Pages.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.WEB_BASE_URL ? { baseUrl: process.env.WEB_BASE_URL } : {}),
  },
});
