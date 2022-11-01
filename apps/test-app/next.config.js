//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withNx } = require('@nrwl/next/plugins/with-nx');

const { withSentryConfig } = require('@sentry/nextjs');

const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

const contentSecurityPolicy = `
  frame-ancestors 'self' *.google.com *.googleusercontent.com
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=15768000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }
];

const otherHeaders = [
  {
    key: 'Edge-Cache-Tag',
    value: 'gemini, gemini_origins-com'
  }
];

/**
 * @type {import('@nrwl/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  experimental: {
    optimizeCss: true,
    newNextLinkBehavior: true
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [...securityHeaders, ...otherHeaders]
      }
    ];
  },
  images: {
    loader: 'akamai',
    path: 'https://www.origins.com/'
  },
  nx: {
    svgr: true
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/home'
        },
        {
          source: '/media/:slug*',
          destination: 'https://www.origins.com/media/:slug*'
        }
      ],
      afterFiles: [],
      fallback: []
    };
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')]
  },
  webpack: (config, { dev, isServer, ...options }) => {
    if (process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze/client.html'
        })
      );
    }


    config.plugins.push(
      new ModuleFederationPlugin({
        remotes: {
          elc_service_analytics:
            'elc_service_analytics@http://localhost:8000/fe-elc-service-analytics/build/bundle.js'
        }
      })
    );

    const performance = dev
      ? config.performance
      : {
          hints: 'error',
          // ±300kb gzipped
          maxAssetSize: 12000000, //TODO: rollback this to 1200000 when Content Mocks are removed.
          maxEntrypointSize: 12000000 //TODO: rollback this to 1200000 when Content Mocks are removed.
        };
    config.performance = performance;
    return config;
  },
  sentry: {
    hideSourceMaps: false,
    autoInstrumentServerFunctions: false,
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