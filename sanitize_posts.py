import os
import json
import re
import base64
import time
import random

def sanitize_posts():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    posts_path = os.path.join(base_dir, 'data', 'posts.json')
    images_dir = os.path.join(base_dir, 'data', 'images')
    
    os.makedirs(images_dir, exist_ok=True)
    
    print(f"Reading {posts_path}...")
    with open(posts_path, 'r', encoding='utf-8') as f:
        posts = json.load(f)
        
    modified = False
    
    for post in posts:
        if not post:
            continue
        
        post_id = post.get('id', 'unknown')
        
        if 'img' in post and isinstance(post['img'], list):
            for idx, img_src in enumerate(post['img']):
                if img_src and img_src.startswith('data:image/'):
                    modified = True
                    ext = 'png'
                    match = re.match(r'^data:image/([a-zA-Z0-9+]+);base64,', img_src)
                    if match:
                        ext = match.group(1)
                        if ext == 'jpeg':
                            ext = 'jpg'
                    
                    base64_data = img_src.split(',')[1]
                    try:
                        img_bytes = base64.b64decode(base64_data)
                    except Exception as e:
                        print(f"Failed to decode base64 for post {post_id} img index {idx}: {e}")
                        continue
                        
                    timestamp = int(time.time())
                    rand_suffix = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=6))
                    filename = f"img_{post_id}_{idx}_{timestamp}_{rand_suffix}.{ext}"
                    file_path = os.path.join(images_dir, filename)
                    
                    with open(file_path, 'wb') as img_f:
                        img_f.write(img_bytes)
                        
                    relative_path = f"data/images/{filename}"
                    print(f"Extracted image to {relative_path}")
                    post['img'][idx] = relative_path
                    
        if 'content' in post and isinstance(post['content'], str):
            content = post['content']
            img_pattern = re.compile(r'<img([^>]+)src="data:image/([a-zA-Z0-9+]+);base64,([^"]+)"([^>]*)>')
            
            inline_idx = [0]
            def replace_inline(match):
                modified_flag = [True]
                ext = match.group(2)
                if ext == 'jpeg':
                    ext = 'jpg'
                base64_data = match.group(3)
                try:
                    img_bytes = base64.b64decode(base64_data)
                except Exception as e:
                    print(f"Failed to decode inline base64 for post {post_id}: {e}")
                    return match.group(0)
                    
                timestamp = int(time.time())
                rand_suffix = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=6))
                filename = f"img_inline_{post_id}_{inline_idx[0]}_{timestamp}_{rand_suffix}.{ext}"
                file_path = os.path.join(images_dir, filename)
                
                with open(file_path, 'wb') as img_f:
                    img_f.write(img_bytes)
                    
                relative_path = f"data/images/{filename}"
                print(f"Extracted inline image to {relative_path}")
                inline_idx[0] += 1
                
                return f'<img{match.group(1)}src="{relative_path}"{match.group(4)}>'
                
            new_content = img_pattern.sub(replace_inline, content)
            if new_content != content:
                post['content'] = new_content
                modified = True
            
    if modified:
        print(f"Saving updated posts.json...")
        with open(posts_path, 'w', encoding='utf-8') as f:
            json.dump(posts, f, indent=2, ensure_ascii=False)
        print("Done!")
    else:
        print("No base64 images found to sanitize.")

if __name__ == "__main__":
    sanitize_posts()
