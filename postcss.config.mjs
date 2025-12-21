/** @type {import('postcss-load-config').Config} */
const config = {
  map: false, // Disable source maps to avoid source-map-js dependency
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
