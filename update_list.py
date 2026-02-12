import os
import json
from datetime import datetime

# 설정: 포스트가 있는 폴더 이름
POSTS_DIR = 'posts'
OUTPUT_FILE = os.path.join(POSTS_DIR, 'list.json')

def get_post_info(filename):
    """
    HTML 파일 내에서 제목과 날짜를 추출하거나, 
    파일 정보를 기반으로 메타데이터를 생성합니다.
    """
    filepath = os.path.join(POSTS_DIR, filename)
    
    # 기본 정보 (수정 가능)
    title = filename.replace('.html', '').replace('_', ' ') # 파일명 = 제목
    category = "기타" # 기본 카테고리
    date_str = datetime.today().strftime('%Y-%m-%d')

    # HTML 파일을 읽어서 특정 주석이나 태그에서 정보를 가져올 수도 있습니다.
    # 여기서는 간단하게 파일 생성 시간을 날짜로 씁니다.
    try:
        creation_time = os.path.getctime(filepath)
        date_str = datetime.fromtimestamp(creation_time).strftime('%Y-%m-%d')
    except:
        pass

    return {
        "title": title,
        "date": date_str,
        "category": category,
        "filename": filename,
        "type": "post"
    }

def main():
    post_list = []
    
    # posts 폴더의 모든 파일을 검사
    if not os.path.exists(POSTS_DIR):
        print(f"'{POSTS_DIR}' 폴더가 없습니다.")
        return

    files = os.listdir(POSTS_DIR)
    
    # 최신 글이 위로 오도록 정렬 (파일명 역순)
    files.sort(reverse=True)

    for f in files:
        # list.json 파일 자기 자신은 제외하고 html 파일만 처리
        if f.endswith('.html'):
            post_info = get_post_info(f)
            post_list.append(post_info)

    # JSON 파일로 저장
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        json.dump(post_list, outfile, ensure_ascii=False, indent=2)
    
    print(f"총 {len(post_list)}개의 포스트가 {OUTPUT_FILE}에 등록되었습니다.")

if __name__ == "__main__":
    main()
