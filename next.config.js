/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ensure the plain-text prompt files are bundled into serverless functions
    // so loadPrompt() can read them at runtime.
    outputFileTracingIncludes: {
      "/**": ["./prompts/**/*"],
    },
  },
};

module.exports = nextConfig;
