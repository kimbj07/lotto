/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // app/opengraph-image.tsx reads a vendored font with readFile at build
    // time. The file wasn't in the route's trace (.nft.json) — safe only
    // because the route prerenders; pin it so a future dynamic render
    // can't ENOENT.
    outputFileTracingIncludes: {
      '/opengraph-image': ['./app/fonts/Jua-og.ttf'],
    },
  },
};

export default nextConfig;
