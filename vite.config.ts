import { existsSync } from "node:fs";
import { join } from "node:path";
import { getPluginsList } from "./build/plugins";
import { include, exclude } from "./build/optimize";
import {
  type UserConfigExport,
  type ConfigEnv,
  type PluginOption,
  loadEnv
} from "vite";

import {
  root,
  alias,
  wrapperEnv,
  pathResolve,
  __APP_INFO__
} from "./build/utils";

// 开发服务器：对 public 下不存在的 .pbf 矢量瓦片返回 404，
// 避免 Vite SPA 回退把 index.html 当瓦片返回（否则矢量瓦片解析报 Unimplemented type）。
const missingPbf404Plugin: PluginOption = {
  name: "missing-pbf-404",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const path = req.url?.split("?")[0] ?? "";
      if (path.endsWith(".pbf")) {
        const filePath = join(root, "public", decodeURIComponent(path));
        if (!existsSync(filePath)) {
          res.statusCode = 404;
          res.end();
          return;
        }
      }
      next();
    });
  }
};

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } =
    wrapperEnv(loadEnv(mode, root));
  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias
    },
    // 服务端渲染
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
      // 本地跨域代理 https://cn.vitejs.dev/config/server-options.html#server-proxy
      proxy: {},
      // 预热文件以提前转换和缓存结果，降低启动期间的初始页面加载时长并防止转换瀑布
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"]
      }
    },
    plugins: [
      missingPbf404Plugin,
      ...getPluginsList(VITE_CDN, VITE_COMPRESSION)
    ],
    // https://cn.vitejs.dev/config/dep-optimization-options.html#dep-optimization-options
    optimizeDeps: {
      include,
      exclude
    },
    build: {
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "es2015",
      sourcemap: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        input: {
          index: pathResolve("./index.html", import.meta.url)
        },
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]"
        }
      }
    },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__)
    }
  };
};
