import os
import json
import re
from datetime import datetime

# 설정
POSTS_DIR = 'posts'
OUTPUT_FILE = os.path.join(POSTS_DIR, 'list.json')

def get_post_info(filename):
    filepath = os.path.join(POSTS_DIR, filename)
    
    title = filename.replace('.html', '').replace('_', ' ')
    category = "기타"
    date_str = datetime.today().strftime('%Y-%m-%d')
    tags = [] # 해시태그 리스트

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # 1. 카테고리
            cat_match = re.search(r'<meta\s+name=["\']category["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
            if cat_match:
                category = cat_match.group(1)

            # 2. 날짜
            date_match = re.search(r'<meta\s+name=["\']date["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
            if date_match:
                date_str = date_match.group(1)
            else:
                creation_time = os.path.getctime(filepath)
                date_str = datetime.fromtimestamp(creation_time).strftime('%Y-%m-%d')

            # 3. 해시태그 (추가됨) <meta name="tags" content="태그1, 태그2">
            tag_match = re.search(r'<meta\s+name=["\']tags["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
            if tag_match:
                # 쉼표로 분리하고 공백 제거
                tags = [t.strip() for t in tag_match.group(1).split(',') if t.strip()]

            # 4. 제목
            title_match = re.search(r'<h1>(.*?)</h1>', content, re.IGNORECASE)
            if title_match:
                title = title_match.group(1)

    except Exception as e:
        print(f"Error reading {filename}: {e}")

    return {
        "title": title,
        "date": date_str,
        "category": category,
        "tags": tags, # JSON에 태그 정보 포함
        "filename": filename,
        "type": "post"
    }

def main():
    if not os.path.exists(POSTS_DIR):
        print(f"'{POSTS_DIR}' 폴더가 없습니다.")
        return

    post_list = []
    files = os.listdir(POSTS_DIR)
    
    for f in files:
        if f.endswith('.html'):
            post_list.append(get_post_info(f))

    # 날짜 최신순 정렬
    post_list.sort(key=lambda x: x['date'], reverse=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        json.dump(post_list, outfile, ensure_ascii=False, indent=2)
    
    print(f"✅ 업데이트 완료! {len(post_list)}개의 포스트, 태그 정보 포함.")

if __name__ == "__main__":
    main()
