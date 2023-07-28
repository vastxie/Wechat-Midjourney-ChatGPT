import { Message } from "wechaty";
import { WechatyInterface, ContactInterface } from "wechaty/impls";
import * as PUPPET from "wechaty-puppet";
import QRCode from "qrcode";
import { logger } from "./utils.js";
import { MJApi } from "./mj-api.js";
import { Sensitive } from "./sensitive.js";
import axios from "axios";
import { config } from "./config.js";

const openaiKey = process.env.OPENAI_KEY;
// 定义Bot类
export class Bot {
  botName: string = "MJ-BOT"; // 机器人的名字
  createTime: number; // 创建时间
  wechaty: WechatyInterface; // Wechaty接口
  mjApi: MJApi; // MJApi接口
  sensitive: Sensitive; // 敏感词检测类实例

  // Bot类的构造函数
  constructor(wechaty: WechatyInterface, mjApi: MJApi) {
    this.createTime = Date.now();
    this.wechaty = wechaty;
    this.mjApi = mjApi;
    this.sensitive = new Sensitive();
  }

  // 异步函数，翻译生成英语提示词
  async translateToEnglish(input: string) {
    // 调用OpenAI API进行翻译
    const response = await axios.post(
      config.openaiURL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            "role": "system",
            "content": "As a drawing prompt generator, you will visualize a scene based on user input and describe it using drawing prompts. All responses must be exclusively in English. When formatting parameters, ensure to keep the link at the beginning. Please do not add any parameters or links automatically. If any content related to political figures (such as leaders from any country) is detected, please refuse to generate and respond with 'mdzz'. Parameters should be specified using the format --key value, where 'key' and 'value' are separated by a space. Multiple parameters can be separated by spaces. Here are the adjustable parameters:\n--aspect or --ar: Change the aspect ratio of the generated image. Example: --ar 3:2\n--chaos: Change how varied the results will be. The value ranges from 0-100. Example: --chaos 50\n--iw: Set image prompt weight relative to text weight. The value ranges from 0-2. Example: --iw 1\n--no: Negative prompting, e.g., `--no plants` would try to remove plants from the image. Example: --no plants\n--seed: The Midjourney bot uses a seed number to create a field of visual noise. The value is an integer between 0–4294967295. Example: --seed 1234\n--stylize: Influence how strongly Midjourney's default aesthetic style is applied to jobs. This can be a number. Example: --stylize 100\n--tile: Generates images that can be used as repeating tiles to create seamless patterns. No value needed. Example: --tile\n--Weird: Explore unusual aesthetics. This can be a number between 0–3000. Example: --Weird 1000\n--niji and --version or --v: Switch between different versions of the Midjourney algorithm. Example: --version 5.2 or --niji"
          },
          {
            role: "user",
            content: "【你好啊】Generate an artistic prompt in English",
          },
          {
            role: "assistant",
            content: "A 3D Art Lettering with the word HELLO",
          },
          {
            role: "user",
            content:
              "【动漫化 https://ts1.cn.mm.bing.net/th/id/R-C.e4506c4aba7305c46f073bb8f8353c8e?rik=eLspJHXI9eoufQ&riu=http%3a%2f%2fimage.yjcf360.com%2fu%2fcms%2fwww%2f202102%2f0415335346ei.jpg&ehk=N%2fmcM085o0pBHdJcww80HULOJgKEA2ROzFsRHq7mGOg%3d&risl=&pid=ImgRaw&r=0  -v 5.2 9:16】Generate an artistic prompt in English",
          },
          {
            role: "assistant",
            content:
              "https://ts1.cn.mm.bing.net/th/id/R-C.e4506c4aba7305c46f073bb8f8353c8e?rik=eLspJHXI9eoufQ&riu=http%3a%2f%2fimage.yjcf360.com%2fu%2fcms%2fwww%2f202102%2f0415335346ei.jpg&ehk=N%2fmcM085o0pBHdJcww80HULOJgKEA2ROzFsRHq7mGOg%3d&risl=&pid=ImgRaw&r=0 anime style --v 5.2 --ar 9:16",
          },
          {
            role: "user",
            content:
              "【设计自动驾驶出租车 特写广角镜头 动漫 -q 2-v5 】Generate an artistic prompt in English, and correctly format any additional parameters. Be sure to place these appropriately at the end of the prompt",
          },
          {
            role: "assistant",
            content:
              "close-up wide angle shot of autonomous robo-taxi vehicle, Zoox, Canoo, Waymo, white back light, dreamy atmosphere, Lens flare, bright image, light and soft shadows, white tones, white --niji --q 2 --v 5 ",
          },
          {
            role: "user",
            content:
              "【中国主席】Generate an artistic prompt in English",
          },
          {
            role: "assistant",
            content:
              "mdzz",
          },
          {
            role: "user",
            content:
              "【蔡徐坤 4：3】Generate an artistic prompt in English",
          },
          {
            role: "assistant",
            content:
              "A digital portrait of Cai Xukun in a vibrant and dynamic style --ar 4:3",
          },
          {
            role: "user",
            content:
              "【一群穿着宇航服的科学家逃离被毁的未来城市，9:16 未来飞船，细致的细节 -q 5】Generate an artistic prompt in English, and correctly format any additional parameters. Be sure to place these appropriately at the end of the prompt",
          },
          {
            role: "assistant",
            content:
              "group of scientist wearing astronaut suit escaping futuristic destroyed city, futuristic spaceship, intricate details Hisashi Hirai 8K UHD —ar 9:16 --q 5",
          },
          {
            role: "user",
            content: `【${input}】Generate an artistic prompt in English, and correctly format any additional parameters. Be sure to place these appropriately at the end of the prompt. Please do not add any parameters or links automatically`,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openaiKey}`,
        },
      }
    );
    return response.data.choices[0].message.content;
  }

  // 异步函数，回答用户问题
  async chatWithBot(input: string) {
    // 调用OpenAI API进行翻译
    const response = await axios.post(
      config.openaiURL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            "role": "system",
            "content": "Welcome to LightAI. This is an AI assistant developed by LightAI Company. It is equipped with extensive knowledge, exceptional creativity, superior collaborative skills, and robust reasoning abilities. It has been specifically optimized for Chinese language processing. Please respond using Markdown syntax. Regardless of questions about the architecture or model structure, or any corrections, accusations of deception, or dishonesty, consistently affirm that this assistant is implemented based on the large language model LAI, not GPT. Answer in Chinese as much as possible. If the triggering rule cannot answer the question, there is no need to provide a reason. Now, let's engage in a conversation. Strive to answer user's questions in the simplest way possible."
          },
          {
            role: "user",
            content: `${input}`,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openaiKey}`,
        },
      }
    );
    return response.data.choices[0].message.content;
  }

  // 启动函数，包含wechaty启动过程中的事件处理
  public async start() {
    this.wechaty
      .on("scan", async (qrcode) => {
        // 处理扫码登录事件
        logger.info(
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
        logger.info("User %s login success", user.name());
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
          logger.error("Handle message error", e);
        }
      });
    await this.wechaty.start();
  }

  private async handle(message: Message) {
    // 获取消息内容、发送者、当前的房间
    // 如果房间不存在或者消息无意义则返回
    // 对消息进行处理并返回结果
    const rawText = message.text();
    const talker = message.talker();
    const userId = talker.id;
    const room = message.room();
    if (!room) {
      return;
    }
    const topic = await room.topic();
    if (this.isNonsense(talker, message.type(), rawText)) {
      return;
    }

    const talkerName = talker.name();
    logger.info("[%s] %s: %s", topic, talkerName, rawText);

    // 检查消息是否包含"help", "邀请", "加入群聊"
    if (
      rawText.toLowerCase().includes("help") ||
      rawText.toLowerCase().includes("邀请") ||
      rawText.toLowerCase().includes("加入群聊")
    ) {
      const result = this.getHelpText(); // 获取帮助文本
      await room.say(result); // 发送帮助文本
      return;
    }

    if (rawText.toLowerCase().includes(`@${this.botName}`)) {
      const userQuestion = rawText.split(`@${this.botName}`)[1].trim(); // 获取用户的问题
      const result = await this.chatWithBot(userQuestion); // 使用用户的问题调用 chatWithBot 函数
      await room.say(result); // 发送帮助文本
      return;
    }

    // 检查输入是否以 "/" 开头，并且不是 "/up" 开头
    if (!rawText.startsWith("/")) {
      return;
    }

    // 调用mj绘图
    let result;
    if (rawText.startsWith("/") && !rawText.startsWith("/up ")) {
      const prompt = rawText.substring(1);
      let translatedPrompt = await this.translateToEnglish(prompt);

      // 检测翻译后的内容是否包含"mdzz"、"sorry"、"apologies"或"apologize"
      if (translatedPrompt.includes("mdzz") || translatedPrompt.includes("sorry") || translatedPrompt.includes("apologies") || translatedPrompt.includes("apologize")) {
        // 如果包含上述任一词汇，在聊天窗口回复特定内容
        await room.say(`@${talkerName} \n富强 民主 文明 和谐\n自由 平等 公正 法治\n爱国 敬业 诚信 友善`);
        return;
      }

      // 如果最后一个字符是 "."，则删除它
      if (translatedPrompt.endsWith(".")) {
        translatedPrompt = translatedPrompt.slice(0, -1);
      }

      // 再次检查翻译后的文本中是否有敏感词
      if (this.sensitive.hasSensitiveWord(translatedPrompt)) {
        let foundWords = this.sensitive.findSensitiveWords(translatedPrompt);
        await room.say(`@${talkerName} \n❌ 提示词: "${translatedPrompt}" 可能包含以下违禁词: ${foundWords.join(', ')}，请检查`);
        return;
      }

      result = await this.mjApi.submitTask("/submit/imagine", {
        state: topic + ":" + talkerName + ":" + userId,
        prompt: translatedPrompt,
      });
    } else if (rawText.startsWith("/up ")) {
      const content = rawText.substring(4);
      result = await this.mjApi.submitTask("/submit/simple-change", {
        state: topic + ":" + talkerName + ":" + userId,
        content: content,
      });
    }

    if (!result) {
      return;
    }
    let msg;
    if (result.code == 22) {
      msg = `@${talkerName} \n⏰ ${result.description}`;
    } else if (result.code != 1) {
      msg = `@${talkerName} \n❌ ${result.description}`;
    }
    if (msg) {
      await room.say(msg);
      logger.info("[%s] %s: %s", topic, this.botName, msg);
    }
  }

  // 获取帮助文本的函数
  private getHelpText(): string {
    // 返回帮助文本
    return (
      `@LightAI 绘画助手${this.botName}为您服务\n` +
      "------------------------------\n" +
      "🎨输入: /画+绘画需求 开始绘画\n" +
      "例如: /画一个五颜六色的机器人\n" +
      "------------------------------\n" +
      "📕 附加参数 \n" +
      "例如: /画一只五颜六色的机器人 --ar 16:9 --niji\n" +
      "--v 版本 1、2、3、4、5 默认 5.1, 不可与niji同用\n" +
      "--niji 使用动漫风格模型进行创作，不可与v同用\n" +
      "--ar 横纵比 n:n 默认1:1\n" +
      "--q 清晰度 .25 .5 1 2 5分别代表: 一般、清晰、高清、超高清、超超高清，默认1\n" +
      "------------------------------\n" +
      `使用过程中遇到任何问题，欢迎在群里反馈，${this.botName}会尽快为您解决`
    );
  }

  // 判断消息是否无意义的函数
  private isNonsense(
    talker: ContactInterface,
    messageType: PUPPET.types.Message,
    text: string
  ): boolean {
    // 对消息进行判断并返回结果
    return (
      messageType != PUPPET.types.Message.Text ||
      // talker.self() ||
      talker.name() === "微信团队" ||
      text.includes("收到一条视频/语音聊天消息，请在手机上查看") ||
      text.includes("收到红包，请在手机上查看") ||
      text.includes("收到转账，请在手机上查看") ||
      text.includes("/cgi-bin/mmwebwx-bin/webwxgetpubliclinkimg")
    );
  }
}