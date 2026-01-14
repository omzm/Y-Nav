import { onRequestPost as __api_webdav_ts_onRequestPost } from "/Users/yml/codes/CloudNav-abcd/functions/api/webdav.ts"
import { onRequest as __api_sync_ts_onRequest } from "/Users/yml/codes/CloudNav-abcd/functions/api/sync.ts"

export const routes = [
    {
      routePath: "/api/webdav",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_webdav_ts_onRequestPost],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_sync_ts_onRequest],
    },
  ]