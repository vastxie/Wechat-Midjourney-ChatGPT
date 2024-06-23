// 引入WechatyBuilder，用于创建Wechaty实例
import { WechatyBuilder } from "wechaty";
// 引入Bot，用于处理wechaty机器人的相关操作
import { Bot } from "./bot.js";

// 创建wechaty实例，设置了机器人的名字、使用的puppet和puppet的配置选项
const wechaty = WechatyBuilder.build({
  name: "wechat-bot",
  puppet: "wechaty-puppet-wechat",
  puppetOptions: {
    uos: true,
  },
});

// 创建Bot实例，传入wechaty实例和MJApi实例
const bot = new Bot(wechaty);
// 启动机器人
await bot.start();
