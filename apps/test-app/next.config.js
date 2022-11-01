//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withNx } = require('@nrwl/next/plugins/with-nx');

const { withSentryConfig } = require('@sentry/nextjs');

const { ModuleFederationPlugin } = require('webpack').container;

/**
 * @type {import('@nrwl/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  webpack: (config, { dev, isServer, ...options }) => {

    config.plugins.push(
      new ModuleFederationPlugin({
        remotes: {
          elc_service_analytics:
            'elc_service_analytics@http://localhost:8000/fe-elc-service-analytics/build/bundle.js'
        }
      })
    );

    return config;
  },
  sentry: {
    hideSourceMaps: false,
  }
};

const sentryWebpackPluginOptions = {
   silent: false,
};

const nxConfig = withSentryConfig(
  withNx(nextConfig),
  sentryWebpackPluginOptions
);

module.exports = nxConfig;