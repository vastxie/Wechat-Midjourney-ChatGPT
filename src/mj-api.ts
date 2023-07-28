// 引入所需的模块
import express, { Request, Response } from "express";
import { WechatyInterface } from 'wechaty/impls';
import { FileBox } from 'file-box';
import { logger, displayMilliseconds } from "./utils.js";
import { config } from "./config.js";
import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import sharp from 'sharp';
import crypto from 'crypto';
import mysql, { FieldPacket } from 'mysql2/promise';


// 提交结果的类定义
export class SubmitResult {
  code: number;
  description: string;
  result: string = "";

  constructor(code: number, description: string) {
    this.code = code;
    this.description = description;
  }
};

// MJApi类的定义，包含一个监听器，可以监听和处理特定的http请求，并通过wechaty接口发送信息
export class MJApi {
  db: mysql.Pool;  // 修改类型为 Pool
  listenerPort: number = 4120;  //监听的端口号，从配置文件中获取
  wechaty: WechatyInterface;  // Wechaty接口对象
  axiosInstance: AxiosInstance; // axios实例对象，用于http请求

  // 构造函数，接受一个Wechaty接口对象，创建axios实例
  constructor(wechaty: WechatyInterface) {
    this.wechaty = wechaty;
    this.axiosInstance = axios.create({
      baseURL: config.mjProxyEndpoint,
      timeout: 60000  // 从配置文件中获取请求超时时间
    });
    this.db = mysql.createPool({  // 使用 createPool 创建连接池
      host: 'localhost',
      user: 'mj',
      password: 'mj',
      database: 'mj'
    });
  }

  // 设置监听器，监听/notify路由，处理对应的POST请求
  public async listenerNotify() {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 设置POST路由处理函数
    app.post("/notify", async (req: Request, res: Response): Promise<Response> => {
      return this.handle(req, res);
    });

    // 在指定端口启动监听器
    app.listen(this.listenerPort, (): void => {
      logger.info("mj listener start success on port %d", this.listenerPort);
    });
  }

  // 提交任务的方法，接收url和参数，然后通过axios发送POST请求
  public async submitTask(url: string, params: any): Promise<SubmitResult> {
    const notifyHook = config.notifyHook ? { notifyHook: config.notifyHook } : {};
    // 提取用户ID
    const userId = params.state.split(':')[2];

    // 查询用户的绘图次数
    const [rows, _]: [mysql.RowDataPacket[], FieldPacket[]] = await this.db.query('SELECT drawCount FROM user_table WHERE userid = ?', [userId]);

    // 如果用户的绘图次数大于或等于10，返回一个特定的SubmitResult对象
    if (rows.length > 0 && rows[0].drawCount >= 100) {
      return new SubmitResult(-10, "今日绘图次数过多\n可在网页端继续使用\nhttps://asst.lightai.cloud/midjourney");
    }
    try {
      // 使用axios实例发送POST请求
      const response = await this.axiosInstance.post(url, { ...params, ...notifyHook }, {
        headers: {
          'mj-api-secret': config.mjApiSecret
        }
      });
      if (response.status === 200) {
        // 返回服务器的响应数据
        return response.data;
      }
      // 如果服务器响应状态码不是200，记录错误日志并返回一个SubmitResult对象
      logger.error("submit mj task failed, %d: %s", response.status, response.statusText);
      return new SubmitResult(response.status, response.statusText);
    } catch (e) {
      // 如果在发送请求的过程中出现异常，记录错误日志并返回一个SubmitResult对象
      logger.error("submit mj error", e);
      return new SubmitResult(-9, "MJ服务异常, 请稍后再试");
    }
  }

  // 代理下载图片的方法，接收图片的url，通过axios下载图片并转换为png格式返回
  private async proxyDownloadImage(url: string): Promise<FileBox> {
    try {
      const response: AxiosResponse = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        timeout: 60000,  // 从配置文件中获取请求超时时间
      });

      // 提取图片的数据和文件名
      let imageData = response.data;
      let filename = url.split('/').pop() || crypto.randomBytes(16).toString('hex');

      // 如果图片是webp格式，则转换为png
      if (filename.endsWith('.webp')) {
        imageData = await sharp(imageData).png().toBuffer();
        filename = `${filename.split('.').shift()}.png`;
      }

      // 创建一个FileBox对象并返回
      const fileBuffer = Buffer.from(imageData, 'binary');
      return FileBox.fromBuffer(fileBuffer, filename);
    } catch (e) {
      // 如果在下载图片的过程中出现异常，记录错误日志并抛出异常
      logger.error("proxy download image error", e);
      throw new Error("proxy download image error");
    }
  }

  // 处理http请求的方法，接收Request和Response对象，然后根据请求的内容，通过wechaty发送对应的消息
  private async handle(req: Request, res: Response) {
    try {
      const state = req.body.state;
      const i = state.indexOf(":");
      const roomName = state.substring(0, i);
      const rest = state.substring(i + 1);
      const j = rest.indexOf(":");
      const userName = rest.substring(0, j);
      const userid = rest.substring(j + 1);
      const room = await this.wechaty.Room.find({ topic: roomName });
      if (!room) {
        return res.status(404).send("room not found");
      }
      const action = req.body.action;
      const status = req.body.status;
      const userDescription = req.body.description;
      // 在处理返回给用户的消息时，如果description中包含"--turbo"，则移除
      //const userDescription = description.replace(" --turbo", "");

      if (status == -10) {
        room.say(`@${userName} \n❌ ${userDescription}`);
      }
      else if (status == 'SUBMITTED') {
        room.say(`@${userName} \n✅ 任务已提交\n✨ ${userDescription}\n🎨 绘图中，请稍候`);
      } else if (status == 'FAILURE') {
        room.say(`@${userName} \n❌ 任务执行失败\n✨ ${userDescription}\n📒 失败原因: ${req.body.failReason}`);
      } else if (status == 'SUCCESS') {
        const time = req.body.finishTime - req.body.submitTime;
        if (action == 'UPSCALE') {
          await room.say(`@${userName} \n🎨 图片放大，用时: ${displayMilliseconds(time)}\n✨ ${userDescription}`);
          let image;
          image = await this.proxyDownloadImage(req.body.imageUrl);
          await room.say(image);  // 注意这里使用了await来确保图片消息在文本消息之后发送
        } else {
          const [rows, _]: [mysql.RowDataPacket[], FieldPacket[]] = await this.db.query('SELECT * FROM user_table WHERE userid = ?', [userid]);
          let drawCount = 1;
          if (rows.length > 0) {  // 如果存在这个用户ID
            drawCount = (rows[0] as any).drawCount + 1;
            // 更新累积绘画次数
            await this.db.query('UPDATE user_table SET drawCount = ? WHERE userid = ?', [drawCount, userid]);
            console.log('Updated draw count to', drawCount);
          } else {  // 如果不存在这个用户ID
            // 插入一条新记录
            await this.db.query('INSERT INTO user_table (userid, drawCount) VALUES (?, ?)', [userid, drawCount]);
            console.log('Inserted new user with draw count', drawCount);
          }
          const taskId = req.body.id;
          const prompt = req.body.prompt;
          //const prompt = req.body.prompt.replace(" --turbo", "");
          const trimmedPrompt = prompt.length > 40 ? prompt.substring(0, 40) + " ..." : prompt;
          await room.say(`@${userName} \n🎨 ${action == 'IMAGINE' ? '绘图' : '变换'}成功，今日累计 ${drawCount} 次 \n🕙 用时 ${displayMilliseconds(time)}\n✨ 提示词 ${trimmedPrompt}\n🪄 U1～U4 放大，V1～V4 变换\n✏️ [/up + ID + 操作]，例如：\n/up ${taskId} U1`);
          let image;
          image = await this.proxyDownloadImage(req.body.imageUrl);
          await room.say(image);  // 注意这里使用了await来确保图片消息在文本消息之后发送
        }
      }
      return res.status(200).send({ code: 1 });
    } catch (e) {
      logger.error("mj listener handle error", e);
      return res.status(500).send({ code: -9 });
    }
  }
}
