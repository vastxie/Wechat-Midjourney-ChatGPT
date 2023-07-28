// 引入fs库，用于文件读写操作
import * as fs from 'fs';

// 定义敏感词过滤类
export class Sensitive {
    // 敏感词文件路径，默认为'config/sensitive_words.txt'
    filePath: string = 'config/sensitive_words.txt';
    // 存放敏感词的数组
    blockWords: string[] = [];

    // 构造函数
    constructor() {
        // 读取文件内容
        const content = fs.readFileSync(this.filePath, 'utf8');
        // 按换行符切割文件内容，得到敏感词数组
        this.blockWords = content.split("\n");
    }

    // 判断输入的文本是否包含敏感词
    public hasSensitiveWord(text: string): boolean {
        // 如果敏感词数组为空，直接返回false
        if (this.blockWords.length == 0) {
            return false;
        }
        // 如果文本中包含数组中的任何一个敏感词，返回true，否则返回false
        return this.blockWords.some((word) => {
            let regex = new RegExp(`\\b${word}\\b`, 'gi');
            return regex.test(text);
        });
    }

    // 添加方法，返回在文本中找到的敏感词
    public findSensitiveWords(text: string): string[] {
        let foundWords = [];
        // 遍历所有敏感词
        for (let word of this.blockWords) {
            // 如果文本包含当前的敏感词，且在单词边界处（即，单词的前后都是空格或标点符号）
            let regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(text)) {
                // 添加到找到的敏感词数组
                foundWords.push(word);
            }
        }
        return foundWords;
    }
}
