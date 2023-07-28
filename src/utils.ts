// 引入log4js库，用于日志记录
import log4js from "log4js";

// 配置log4js，包括文件输出和控制台输出两种方式
log4js.configure({
  // 定义输出器，包括文件输出器和控制台输出器
  appenders: {
    // 文件输出器，会把日志输出到指定的文件中
    fileAppender: { type: "file", filename: "wechat-midjourney.log" },
    // 控制台输出器，会把日志输出到控制台
    stdout: { type: "stdout", layout: { type: "pattern", pattern: "%d [%p] - %m%n" } }
  },
  // 定义日志类别，默认类别使用文件输出器和控制台输出器，日志级别设置为info
  categories: {
    default: { appenders: ["fileAppender", "stdout"], level: "info" }
  }
});

// 获取logger并导出，方便其他模块使用
export const logger = log4js.getLogger();

// 定义一个函数，用于把毫秒数转换成更易读的格式，并导出
export function displayMilliseconds(millisecond: number): string {
  // 把毫秒数转换成分钟数，向下取整
  const minute = Math.floor(millisecond / 1000 / 60);
  // 把剩下的毫秒数转换成秒数，向下取整
  const second = Math.floor((millisecond - minute * 1000 * 60) / 1000);
  // 如果分钟数是0，就只返回秒数；否则，返回分钟数和秒数
  return minute == 0 ? (second + '秒') : (minute + '分' + second + '秒');
}
