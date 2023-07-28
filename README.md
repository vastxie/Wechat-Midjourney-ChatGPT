# Wechat-Midjourney-ChatGPT

基于 [wechaty](https://github.com/wechaty/wechaty) 代理微信客户端，集成 MidJourney 和 ChatGPT 功能。

<img width="1153" alt="image" src="https://github.com/vastxie/Wechat-Midjourney-ChatGPT/assets/24899308/7d3d5598-e697-44ff-81ad-35cf53420b42">

## 功能
- 进群自动回复使用欢迎语。
- 自动翻译，格式化 Midjourney 提示词。
- 过滤敏感词，拒绝绘图。
- 记录不同用户的使用次数，超出限制后回复提示。
- @机器人 自动回复。


## 注意事项
- 本项目依赖于 [midjourney-proxy](https://github.com/novicezk/midjourney-proxy) 提供的 API 接口
- 代理微信存在一定风险，使用时需谨慎。
- 部分配置项需要在 `./src` 目录中修改。


## 新建数据库
创建一个新数据库，用户名、数据库名和密码均设置为 `mj`（可自行在代码中调整）。
使用以下 SQL 语句创建表单：
```sql
CREATE TABLE mj.user_table (
    userid varchar(255) NOT NULL COLLATE utf8mb4_general_ci,
    drawCount int DEFAULT 0
);
```


## 本地启动
```shell
git clone https://github.com/vastxie/Wechat-Midjourney-ChatGPT
cd Wechat-Midjourney-ChatGPT
npm install
# 可能执行错误，缺少library，按提示解决
cp config/.env.example config/.env
# 更改配置项，启动服务
npm run serve
# 或使用 pm2 后台运行
pm2 start
# 查看运行日志/扫码登录
pm2 logs wechat-midjourney
```


## 配置项

| 变量名 | 非空 | 描述 |
| :-----| :----: | :---- |
| MJ_PROXY_ENDPOINT | 是 | midjourney 代理服务的地址 |
| MJ_NOFIFY_HOOK | 是 | 当前服务的回调接收地址 |
| HTTP_PROXY | 否 | 访问 cdn 图片的代理地址 |
| OPENAI_KEY | 是 | openai 服务使用的 key |
| MJ_API_SECRET | 否 | midjourney 代理服务的 key |
| OPENAI_KEY | 是 | openai 服务使用的地址 |

无法访问 https://cdn.discordapp.com 时需设置 `HTTP_PROXY`，示例值：http://127.0.0.1:7890


## 进群体验

感兴趣的朋友也欢迎加入绘画群体验，扫码进群名额已满，可加管理员微信（备注 AI 绘画）邀请进群

<img width="282" alt="image" src="https://github.com/vastxie/Wechat-Midjourney-ChatGPT/assets/24899308/47fa0320-6657-4acb-acf3-a351e21af3d8">
