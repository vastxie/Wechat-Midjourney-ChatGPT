# Wechat-Midjourney-ChatGPT

基于 [wechaty](https://github.com/wechaty/wechaty) 代理的微信机器人，集成 MidJourney 绘画 和 OpenAI Chat 对话。

## 主要功能

- `@机器人` 随机模型回复，`/+序号` 指定模型回复，或使用 `/all` 调用全部模型。
  
  <img width="952" alt="image" src="https://github.com/vastxie/Wechat-Midjourney-ChatGPT/assets/24899308/51659903-3808-4cfb-9eb4-fe72b0298442">
  
- MidJourney 绘画，只支持最简单的绘画功能，自动切图成 4 张
  
  <img width="957" alt="image" src="https://github.com/vastxie/Wechat-Midjourney-ChatGPT/assets/24899308/aa729a6a-c428-4530-8d4b-ca803bf717dd">
  <img width="960" alt="image" src="https://github.com/vastxie/Wechat-Midjourney-ChatGPT/assets/24899308/d5101348-431c-43b4-a274-235eb0ca20ac">


- 自动回复欢迎语。
  
  <img width="957" alt="image" src="https://github.com/vastxie/Wechat-Midjourney-ChatGPT/assets/24899308/b926ce3a-4b1b-439b-8ff7-1dbb60203daf">
  
- 记录不同用户的使用次数，超出限制停止使用。
  
  <img width="953" alt="image" src="https://github.com/vastxie/Wechat-Midjourney-ChatGPT/assets/24899308/a419861d-81a1-4e89-a2ec-db4f64a9ba22">


## 注意事项

- 代理微信存在一定风险，使用时需谨慎。
- 本项目只是个自用的微信 `绘画/对话` 机器人小样，个性化修改需自行调整代码。

## 本地启动

```shell
git clone https://github.com/vastxie/Wechat-Midjourney-ChatGPT

cd Wechat-Midjourney-ChatGPT

# 安装依赖
npm install

# 复制 .env 文件，并按需调整
cp .env.example .env

# 启动服务
npm run serve

# 或使用 PM2 后台运行
pm2 start

# 查看运行日志/扫码登录
pm2 logs wechat-bot

# 如果出现其他依赖缺失或其他错误，可将日志复制给gpt
```

## 进群体验

感兴趣的朋友也欢迎加入绘画群体验，加微信（备注 `AI 绘画`）拉体验群，不接受任何私聊技术质询，有问题优先群内交流。

<img width="282" alt="image" src="https://github.com/vastxie/Wechat-Midjourney-ChatGPT/assets/24899308/47fa0320-6657-4acb-acf3-a351e21af3d8">
