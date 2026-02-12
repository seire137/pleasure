import os
import json
import re
from datetime import datetime

# 설정: 포스트가 있는 폴더 이름
POSTS_DIR = 'posts'
OUTPUT_FILE = os.path.join(POSTS_DIR, 'list.json')

def get_post_info(filename):
    filepath = os.path.join(POSTS_DIR, filename)
    
    # 기본값 설정
    title = filename.replace('.html', '').replace('_', ' ')
    category = "기타"  # 메타 태그가 없으면 '기타'로 분류
    date_str = datetime.today().strftime('%Y-%m-%d') # 메타 태그가 없으면 오늘 날짜
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # 1. 카테고리 추출 (<meta name="category" content="값">)
            cat_match = re.search(r'<meta\s+name=["\']category["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
            if cat_match:
                category = cat_match.group(1)

            # 2. 날짜 추출 (<meta name="date" content="값">)
            date_match = re.search(r'<meta\s+name=["\']date["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
            if date_match:
                date_str = date_match.group(1)
            else:
                # 메타 태그에 날짜가 없으면 파일 생성 시간 사용
                creation_time = os.path.getctime(filepath)
                date_str = datetime.fromtimestamp(creation_time).strftime('%Y-%m-%d')

            # 3. 제목 추출 (<h1>태그가 있으면 제목으로 사용, 없으면 파일명)
            title_match = re.search(r'<h1>(.*?)</h1>', content, re.IGNORECASE)
            if title_match:
                title = title_match.group(1)

    except Exception as e:
        print(f"Error reading {filename}: {e}")

    return {
        "title": title,
        "date": date_str,
        "category": category,
        "filename": filename,
        "type": "post"
    }

def main():
    post_list = []
    
    if not os.path.exists(POSTS_DIR):
        print(f"'{POSTS_DIR}' 폴더가 없습니다.")
        return

    files = os.listdir(POSTS_DIR)
    
    # 파일명으로 정렬하지 않고, 나중에 날짜순으로 정렬할 것임
    temp_list = []

    for f in files:
        if f.endswith('.html'):
            post_info = get_post_info(f)
            temp_list.append(post_info)

    # 날짜 최신순 정렬 (내림차순)
    temp_list.sort(key=lambda x: x['date'], reverse=True)
    post_list = temp_list

    # JSON 저장
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        json.dump(post_list, outfile, ensure_ascii=False, indent=2)
    
    print(f"✅ 업데이트 완료! 총 {len(post_list)}개의 포스트가 등록되었습니다.")
    print(f"📂 저장 위치: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
