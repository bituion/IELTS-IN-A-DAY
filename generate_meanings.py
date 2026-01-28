import os
import csv
import time
from deep_translator import GoogleTranslator

# 配置
INPUT_FILE = 'all_words.txt'
OUTPUT_FILE = 'meanings.csv'
BATCH_SIZE = 50  # 每次处理50个单词
DELAY = 1.5      # 避免请求过快被屏蔽

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"找不到输入文件: {INPUT_FILE}")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        words = [line.strip() for line in f if line.strip()]

    # 读取已有的，实现断点续传
    existing_meanings = {}
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader, None) # skip header
            for row in reader:
                if len(row) >= 2:
                    existing_meanings[row[0]] = row[1]

    translator = GoogleTranslator(source='en', target='zh-CN')

    todo = [w for w in words if w not in existing_meanings]
    print(f"总计 {len(words)} 个单词，已翻译 {len(existing_meanings)} 个，待处理 {len(todo)} 个。")

    if not todo:
        print("所有单词已翻译。")
        return

    # 写入表头（如果是新文件）
    if not os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['word', 'meaning_zh'])

    # 批量翻译
    for i in range(0, len(todo), BATCH_SIZE):
        batch = todo[i:i+BATCH_SIZE]
        print(f"正在翻译批次 {i//BATCH_SIZE + 1} ({batch[0]}...)...")
        
        try:
            # 拼接成一段文本翻译效率更高，但要注意分隔符
            text_to_translate = "\n".join(batch)
            translated = translator.translate(text_to_translate)
            
            meanings = translated.split('\n')
            
            with open(OUTPUT_FILE, 'a', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                for w, m in zip(batch, meanings):
                    writer.writerow([w, m.strip()])
            
            print(f"完成批次 {i//BATCH_SIZE + 1}")
            time.sleep(DELAY)
            
        except Exception as e:
            print(f"翻译过程中出错: {e}")
            print("稍后重试...")
            time.sleep(5)

if __name__ == "__main__":
    main()
