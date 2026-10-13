import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const api = env.API_PROXY_TARGET;

  if (!api) {
    throw new Error("API_PROXY_TARGET 환경변수가 설정되지 않았습니다.");
  }

  return {
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        "/api/v1": {
          target: api,
          changeOrigin: true,

          configure(proxy) {
            // 백엔드 Origin 검사 대응
            proxy.on("proxyReq", (request) => {
              request.setHeader("Origin", api);
            });

            // 로컬 HTTP 개발 환경에서 Secure 쿠키 처리
            proxy.on("proxyRes", (response) => {
              const cookies = response.headers["set-cookie"];

              if (cookies) {
                response.headers["set-cookie"] = cookies.map((cookie) =>
                  cookie.replace(/;\s*Secure/gi, "")
                );
              }
            });
          },
        },
      },
    },
  };
});