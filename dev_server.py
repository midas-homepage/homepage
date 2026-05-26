import http.server
import socketserver
import os
import sys

PORT = 8000
BIND_ADDRESS = "0.0.0.0"

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/upload-member-photo':
            try:
                import json
                import base64
                
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                filename = data['filename']
                # Secure filename: strip directory traversal characters
                filename = os.path.basename(filename)
                
                image_data = data['image']
                header, encoded = image_data.split(",", 1)
                file_bytes = base64.b64decode(encoded)
                
                # Save to images/people/
                target_dir = os.path.join(os.getcwd(), 'images', 'people')
                os.makedirs(target_dir, exist_ok=True)
                target_path = os.path.join(target_dir, filename)
                
                with open(target_path, 'wb') as f:
                    f.write(file_bytes)
                
                # Respond success
                response = {"status": "success", "path": f"images/people/{filename}"}
                response_bytes = json.dumps(response).encode('utf-8')
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_bytes)))
                self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()
                self.wfile.write(response_bytes)
                return
            except Exception as e:
                import json
                response = {"status": "error", "message": str(e)}
                response_bytes = json.dumps(response).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_bytes)))
                self.end_headers()
                self.wfile.write(response_bytes)
                return
        
        elif self.path == '/api/save-members':
            try:
                import json
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                if not isinstance(data, list):
                    raise ValueError("Data must be a JSON array")
                
                target_path = os.path.join(os.getcwd(), 'data', 'members.json')
                with open(target_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                response = {"status": "success"}
                response_bytes = json.dumps(response).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_bytes)))
                self.end_headers()
                self.wfile.write(response_bytes)
                return
            except Exception as e:
                import json
                response = {"status": "error", "message": str(e)}
                response_bytes = json.dumps(response).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_bytes)))
                self.end_headers()
                self.wfile.write(response_bytes)
                return

        elif self.path == '/api/save-posts':
            try:
                import json
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                if not isinstance(data, list):
                    raise ValueError("Data must be a JSON array")
                
                target_path = os.path.join(os.getcwd(), 'data', 'posts.json')
                with open(target_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                response = {"status": "success"}
                response_bytes = json.dumps(response).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_bytes)))
                self.end_headers()
                self.wfile.write(response_bytes)
                return
            except Exception as e:
                import json
                response = {"status": "error", "message": str(e)}
                response_bytes = json.dumps(response).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_bytes)))
                self.end_headers()
                self.wfile.write(response_bytes)
                return
        
        # Fallback for other POST requests
        self.send_error(404, "File not found")

    def end_headers(self):
        # 모든 응답에 강력한 캐시 방지 헤더 주입
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == "__main__":
    # 실행 경로를 스크립트 위치로 고정
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 포트 재사용 허용 설정
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer((BIND_ADDRESS, PORT), NoCacheHTTPRequestHandler) as httpd:
            print(f"Serving HTTP on {BIND_ADDRESS} port {PORT} (Cache disabled)...")
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting server: {e}", file=sys.stderr)
        sys.exit(1)
