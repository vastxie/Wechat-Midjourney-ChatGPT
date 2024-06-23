// src/config.ts
import dotenv from "dotenv";

dotenv.config();

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    apiUrl: process.env.OPENAI_API_URL,
  },
  mj: {
    url: process.env.MJ_URL,
    apiKey: process.env.MJ_API_KEY,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  blacklist: (process.env.BLACKLIST || "").split(","),
};
