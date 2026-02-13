import os
import json
import re
from datetime import datetime

# 설정
POSTS_DIR = 'posts'
OUTPUT_FILE = os.path.join(POSTS_DIR, 'list.json')

def remove_html_tags(text):
    """HTML 태그를 제거하고 순수 텍스트만 추출"""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text).replace('&nbsp;', ' ').strip()

def get_post_info(filename):
    filepath = os.path.join(POSTS_DIR, filename)
    
    title = filename.replace('.html', '').replace('_', ' ')
    category = "기타"
    date_str = datetime.today().strftime('%Y-%m-%d')
    tags = []
    content_text = "" 

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # 메타 데이터 추출
            cat_match = re.search(r'<meta\s+name=["\']category["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
            if cat_match: category = cat_match.group(1)

            date_match = re.search(r'<meta\s+name=["\']date["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
            if date_match: date_str = date_match.group(1)
            else:
                creation_time = os.path.getctime(filepath)
                date_str = datetime.fromtimestamp(creation_time).strftime('%Y-%m-%d')

            tag_match = re.search(r'<meta\s+name=["\']tags["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
            if tag_match: tags = [t.strip() for t in tag_match.group(1).split(',') if t.strip()]

            title_match = re.search(r'<h1>(.*?)</h1>', content, re.IGNORECASE)
            if title_match: title = title_match.group(1)
            
            # 검색용 본문 추출
            content_text = remove_html_tags(content)
            content_text = content_text[:1000] # 길이 제한

    except Exception as e:
        print(f"Error reading {filename}: {e}")

    return {
        "title": title,
        "date": date_str,
        "category": category,
        "tags": tags,
        "content_text": content_text,
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

    post_list.sort(key=lambda x: x['date'], reverse=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        json.dump(post_list, outfile, ensure_ascii=False, indent=2)
    
    print(f"{len(post_list)}개의 포스트 (검색 데이터 포함)")

if __name__ == "__main__":
    main()
