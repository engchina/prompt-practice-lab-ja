import type {NextConfig} from 'next';

const api = process.env.LAB_API_URL ?? 'http://127.0.0.1:8710';

const nextConfig: NextConfig = {
  // 画面はすべてクライアント側。/api は FastAPI へそのまま流す。
  rewrites: async () => [{source: '/api/:path*', destination: `${api}/api/:path*`}],
};

export default nextConfig;
