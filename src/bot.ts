import { Message } from "wechaty";
import { RoomInterface, WechatyInterface } from "wechaty/impls";
import { AxiosResponse } from "axios";
import axios from "axios";
import { FileBox } from "file-box";
import sharp from "sharp";
import QRCode from "qrcode";
import { createClient } from "redis";

import { chatWithBot } from "./chat.js";
import { callDrawApi } from "./draw.js";
import { getModelInfo, getAllModels, ModelInfo } from "./modelUtils.js";
import { config } from "./config.js";

const redisClient = createClient({
  url: config.redis.url,
});

redisClient.connect();

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.log("Redis Client Error", err);
});

// 定义Bot类
export class Bot {
  botName: string = "AIBOT"; // 机器人的名字
  createTime: number; // 创建时间
  wechaty: WechatyInterface; // Wechaty接口

  // 导入黑名单数组
  private blacklist = config.blacklist;

  // 检查用户是否在黑名单中
  private isUserBlacklisted(userName: string): boolean {
    return this.blacklist.includes(userName);
  }

  constructor(wechaty: WechatyInterface) {
    this.createTime = Date.now();
    this.wechaty = wechaty;
  }

  async proxyDownloadImage(url: string): Promise<FileBox> {
    try {
      const response: AxiosResponse = await axios({
        method: "GET",
        url: url,
        responseType: "arraybuffer",
        timeout: 60000,
      });
      // 提取图片的数据
      let imageData = response.data;

      // 为下载的图片生成文件名，确保使用 .png 扩展名
      let filename = "downloaded_image.png";

      // 创建一个FileBox对象并返回
      const fileBuffer = Buffer.from(imageData, "binary");
      return FileBox.fromBuffer(fileBuffer, filename);
    } catch (e) {
      throw new Error("proxy download image error");
    }
  }

  // 检测是否超出使用频率
  async checkDrawingCount(talkerName: string) {
    const MAX_DRAW_COUNT = 8;
    const today = new Date().toISOString().split("T")[0];
    const userDailyKey = `drawCount:daily:${talkerName}:${today}`;

    let dailyCountValue = await redisClient.get(userDailyKey);
    let dailyCount = dailyCountValue !== null ? Number(dailyCountValue) : 0;

    if (talkerName !== "弎水" && dailyCount >= MAX_DRAW_COUNT) {
      return {
        limitReached: true,
        message: `@${talkerName}\n今日使用次数已达上限，请明日再试或在网页端继续使用\nhttps://asst.lightai.cloud`,
      };
    }
    return { limitReached: false, message: "" };
  }

  MAX_RETRIES = 5;
  DELAY = 3000;

  async incrementDrawingCount(talkerName: string) {
    const today = new Date().toISOString().split("T")[0];
    const userDailyKey = `drawCount:daily:${talkerName}:${today}`;

    const secondsTillMidnight =
      (new Date(`${today}T23:59:59`).getTime() - new Date().getTime()) / 1000;
    await redisClient.expire(userDailyKey, Math.floor(secondsTillMidnight));

    let dailyCount = await redisClient.incr(userDailyKey);
    console.log(`Daily count for ${userDailyKey} is now: ${dailyCount}`);
  }

  async parseDrawingCommand(rawText: string) {
    let prompt = rawText.substring(1); // 移除命令前的 '/'

    return { prompt };
  }

  async chatBot(talkerName: string, rawText: string) {
    let userQuestion = rawText.substring(1); // 移除命令前的 '/'

    if (userQuestion.startsWith("all") && talkerName === "弎水") {
      // 如果命令以'all'开头
      userQuestion = userQuestion.substring(3).trim(); // 移除'all'并去除前后空格
      const responses = await this.callAllModels(userQuestion);
      let message = `@${talkerName}:\n`;
      for (const response of responses) {
        message += `(${response.modelName}):\n${response.response}\n\n`;
      }
      return { isChat: true, message: message.trim() };
    }

    const char = userQuestion.charAt(0);
    const modelInfo = getModelInfo(char);

    if ("isChat" in modelInfo && !modelInfo.isChat) {
      return { isChat: false, message: modelInfo.message };
    }

    userQuestion = userQuestion.substring(1).trim();
    const result = await chatWithBot(
      userQuestion,
      (modelInfo as ModelInfo).model
    );
    const message = `@${talkerName} (${
      (modelInfo as ModelInfo).modelName
    }):\n${result}`;
    return { isChat: true, message };
  }

  async callAllModels(input: string) {
    const models = getAllModels();

    // 创建一个包含所有模型异步调用的promise数组
    const modelPromises = models.map(async ({ model, modelName }) => {
      const response = await chatWithBot(input, model);
      return { modelName: modelName, response: response };
    });

    // 使用Promise.all等待所有模型调用完成
    const responses = await Promise.all(modelPromises);
    return responses;
  }

  async processImage(room: RoomInterface, prompt: string) {
    console.log(`开始处理图片，提示词: '${prompt}'`);

    try {
      const imageUrl = await callDrawApi(prompt);
      if (!imageUrl) {
        throw new Error("未能从API获取图片URL。");
      }

      console.log(`从API获得的图片URL: ${imageUrl}`);

      const imageParts = await this.downloadAndSplitImage(imageUrl);
      for (const imagePart of imageParts) {
        console.log(`发送分割后的图片...`);
        await room.say(imagePart);
      }
      console.log(`所有分割后的图片发送成功。`);
    } catch (error) {
      console.error(`处理图片失败: ${error}`);
      // 如果你需要在这里做一些清理工作或特殊处理，可以在这里添加代码
      throw error; // 抛出错误，让调用者知道发生了错误
    }
  }

  async downloadAndSplitImage(url: string): Promise<FileBox[]> {
    try {
      const response = await axios({
        method: "GET",
        url: url,
        responseType: "arraybuffer",
        timeout: 60000,
      });
      const imageBuffer = Buffer.from(response.data, "binary");

      // 获取图片尺寸
      const metadata = await sharp(imageBuffer).metadata();
      // 检查width和height是否定义
      if (
        typeof metadata.width === "undefined" ||
        typeof metadata.height === "undefined"
      ) {
        throw new Error("无法获取图像尺寸");
      }

      const width = metadata.width / 2;
      const height = metadata.height / 2;

      const parts = [];
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          // 裁剪图片
          const partBuffer = await sharp(imageBuffer)
            .extract({
              left: j * width,
              top: i * height,
              width: width,
              height: height,
            })
            .toBuffer();
          // 创建FileBox对象
          parts.push(FileBox.fromBuffer(partBuffer, `part_${i}_${j}.png`));
        }
      }
      return parts;
    } catch (error) {
      console.error("Error downloading or processing image:", error);
      throw new Error("Proxy download image error");
    }
  }

  async checkMessageAndRespond(
    rawText: string,
    room: RoomInterface
  ): Promise<void> {
    // 检查消息是否包含"help", "拍了拍", "加入群聊"
    if (
      rawText.toLowerCase().includes("help") ||
      rawText.toLowerCase().includes("拍了拍") ||
      rawText.toLowerCase().includes("群聊")
    ) {
      const helpText =
        `LightAI 助手${this.botName}为您服务\n` +
        "------------------------------\n" +
        "🎨输入: / + 绘画要求开始绘画\n" +
        "例如: /五颜六色的机器人 动漫\n" +
        `🤖@ ${this.botName} + 问题 随机调用模型回复\n` +
        "------------------------------\n" +
        "使用过程中遇到任何问题，可在群内反馈\n" +
        "AI 助手仅供体验，请勿滥用\n" +
        "更多功能可在网页端使用（对话助手 + 专业绘画 + AI 音乐 + 文生视频）\n" +
        "https://asst.lightai.cloud";
      await room.say(helpText); // 发送帮助文本
    }
  }

  public async start() {
    this.wechaty
      .on("scan", async (qrcode) => {
        // 处理扫码登录事件
        console.log(
          `Scan qrcode to login: https://wechaty.js.org/qrcode/${encodeURIComponent(
            qrcode
          )}`
        );
        console.log(
          await QRCode.toString(qrcode, { type: "terminal", small: true })
        );
      })
      .on("login", (user) => {
        // 处理登录事件
        console.log("User %s login success", user.name());
        this.botName = user.name();
      })
      .on("message", async (message) => {
        // 处理消息事件
        if (message.date().getTime() < this.createTime) {
          return;
        }
        if (!message.room()) {
          return;
        }
        try {
          await this.handle(message);
        } catch (e) {
          if (e instanceof Error) {
            // 如果 e 是 Error 实例，可以安全地访问其 message 属性
            console.log("处理消息时出现错误：" + e.message);
          } else {
            // 如果 e 不是 Error 实例，您可以选择其他方式来记录或处理它
            console.log("处理消息时出现未知错误");
          }
        }
      });
    await this.wechaty.start();
  }

  private async handle(message: Message) {
    const rawText = message.text();
    const talker = message.talker();
    const room = message.room();

    if (!room) {
      return;
    }
    const topic = await room.topic();

    const talkerName = talker.name();
    console.log("[%s] %s: %s" + topic + talkerName + rawText);

    await this.checkMessageAndRespond(rawText, room);

    if (rawText.toLowerCase().includes(`@${this.botName}`)) {
      // 获取用户问题
      const userQuestion = rawText.split(`@${this.botName}`)[1].trim();

      // 生成随机数（1到9之间）
      const randomCommandNumber = Math.floor(Math.random() * 10);

      // 构造新的命令字符串，如"/1 用户问题"，"/2 用户问题"等
      const newCommand = `/${randomCommandNumber} ${userQuestion}`;

      // 调用chatBot函数处理这个新命令
      const { isChat, message } = await this.chatBot(talkerName, newCommand);
      if (isChat) {
        await room.say(message);
        return;
      }
    }

    //if (rawText.startsWith("/")) {
    //await room.say(`@${talkerName} \nAI 绘画调试中，请稍后再试\n或@助手，体验对话功能`);
    //return;
    //}

    if (rawText.startsWith("/")) {
      // 检查用户是否在黑名单中
      if (this.isUserBlacklisted(talkerName)) {
        // 如果用户在黑名单中，则发送提示消息并返回
        await room.say(`@${talkerName}，已经被系统标记，暂时无法使用此功能。`);
        return;
      }
      const checkResult = await this.checkDrawingCount(talkerName);
      if (checkResult.limitReached) {
        await room.say(checkResult.message);
        return;
      }

      const { isChat, message } = await this.chatBot(talkerName, rawText);
      if (isChat) {
        await room.say(message);
        return;
      }

      const startTime = new Date().getTime(); // 获取开始时间的时间戳

      const { prompt } = await this.parseDrawingCommand(rawText);

      try {
        await this.processImage(room, prompt);

        console.log("发送图片到聊天框");

        const endTime = new Date().getTime(); // 获取结束时间的时间戳
        const timeTaken = Math.floor((endTime - startTime) / 1000); // 只取整数秒，忽略小数部分
        await this.incrementDrawingCount(talkerName);
        await room.say(
          `@${talkerName}\n` +
            `🎨绘图成功，用时 ${timeTaken} 秒\n` +
            `✨提示词：${prompt}`
        );
      } catch (error) {
        console.error("处理图片时出错: ", error);
        await room.say(
          `@${talkerName} \n富强 民主 文明 和谐\n自由 平等 公正 法治\n爱国 敬业 诚信 友善`
        );
      }
    }
  }
}
