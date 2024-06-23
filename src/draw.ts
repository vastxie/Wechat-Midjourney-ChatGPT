// src/drawApi.ts
import axios from "axios";
import { config } from "./config.js";

const POLL_INTERVAL = 5000; // 每5秒查一次
const TIMEOUT = 600000; // 超时时间 600秒

async function callDrawApi(prompt: string): Promise<string | undefined> {
  console.log("开始绘制，提示词:", prompt);
  try {
    // 发起绘制请求
    const response = await axios.post(
      `${config.mj.url}/mj/submit/imagine`,
      { prompt },
      {
        headers: {
          "Content-Type": "application/json",
          "mj-api-secret": config.mj.apiKey,
        },
      }
    );

    if (!response.data.result) {
      throw new Error("绘制请求失败，未获取到任务ID。");
    }

    console.log("绘制请求已提交，任务ID:", response.data.result);

    const startTime = Date.now();

    while (Date.now() - startTime < TIMEOUT) {
      await delay(POLL_INTERVAL);

      const drawResponse = await axios.get(
        `${config.mj.url}/mj/task/${response.data.result}/fetch`,
        {
          headers: {
            "Content-Type": "application/json",
            "mj-api-secret": config.mj.apiKey,
          },
        }
      );

      console.log(
        `查询次数: ${
          Math.floor((Date.now() - startTime) / POLL_INTERVAL) + 1
        }, 状态: ${drawResponse.data.status}`,
        "详细响应:",
        JSON.stringify(drawResponse.data, null, 2)
      );

      if (drawResponse.data.status === "SUCCESS") {
        console.log(
          `绘制成功, URL: ${drawResponse.data.imageUrl}`,
          "MidjourneyService"
        );
        return drawResponse.data.imageUrl;
      }
    }

    console.log("绘制请求超时或达到最大重试次数。");
  } catch (error) {
    console.error("调用绘图 API 时出错: ", error);
    throw error;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { callDrawApi };
