// 引入 dotenv 库，用于读取环境变量
import * as dotenv from "dotenv";
// 配置 dotenv，设置环境变量文件的路径
dotenv.config({ path: "config/.env" });

// 定义配置接口，包含四个字段：mjProxyEndpoint、notifyHook、httpProxy 和 imagesPath
export interface IConfig {
  mjProxyEndpoint: string;
  notifyHook: string;
  httpProxy: string;
  imagesPath: string;
  mjApiSecret: string;
  openaiKey: string;
  openaiURL: string;
}

// 导出配置对象。它会尝试从环境变量中获取相应的配置值，如果没有获取到，就使用默认值。
export const config: IConfig = {
  // mjProxyEndpoint 用于定义 MJ Proxy 的端点。如果没有在环境变量中设置，那么默认值是 "http://localhost:8022/mj"
  mjProxyEndpoint: process.env.MJ_PROXY_ENDPOINT || "http://localhost:8022/mj",
  // notifyHook 用于定义通知的 web hook。如果没有在环境变量中设置，那么默认值是 "http://localhost:4120/notify"
  notifyHook: process.env.MJ_NOFIFY_HOOK || "http://localhost:4120/notify",
  // httpProxy 用于定义 HTTP 代理。如果没有在环境变量中设置，那么默认值是空字符串
  httpProxy: process.env.HTTP_PROXY || "",
  // imagesPath 用于定义图片的保存路径。如果没有在环境变量中设置，那么默认值是空字符串
  imagesPath: process.env.IMAGE_PATH || "",
  mjApiSecret: process.env.MJ_API_SECRET || "",
  openaiKey: process.env.OPENAI_KEY || "",
  openaiURL: process.env.OPENAI_URL || "https://api.opanai.com/v1/chat/completions"
}
