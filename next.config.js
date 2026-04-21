/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'res.cloudinary.com',
      // Add Supabase storage URL when configured
    ],
  },
};

module.exports = nextConfig;
