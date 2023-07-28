// 引入WechatyBuilder，用于创建Wechaty实例
import { WechatyBuilder } from "wechaty";
// 引入MJApi，用于处理mj相关的api请求
import { MJApi } from "./mj-api.js";
// 引入Bot，用于处理wechaty机器人的相关操作
import { Bot } from "./bot.js";

// 创建wechaty实例，设置了机器人的名字、使用的puppet和puppet的配置选项
const wechaty = WechatyBuilder.build({
  name: "wechat-midjourney",
  puppet: "wechaty-puppet-wechat",
  puppetOptions: {
    uos: true
  }
});

// 创建MJApi实例，传入wechaty实例
const mjApi = new MJApi(wechaty);
// 开始监听通知
await mjApi.listenerNotify();

// 创建Bot实例，传入wechaty实例和MJApi实例
const bot = new Bot(wechaty, mjApi);
// 启动机器人
await bot.start();
