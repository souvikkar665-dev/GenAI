"""Dependency-light HTTP server for the HTML/CSS/JavaScript frontend and Python API."""
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import json,logging,mimetypes,sys
from backend.core.config import settings
from backend.api.routes import route
ROOT=Path(__file__).resolve().parents[1]
logging.basicConfig(level=getattr(logging,settings.log_level.upper(),logging.INFO),format='%(asctime)s %(levelname)s %(message)s')
class Handler(BaseHTTPRequestHandler):
    server_version='CounterfactualBoardroom/0.1'
    def log_message(self,format,*args):logging.info('%s - %s',self.client_address[0],format%args)
    def send_json(self,status,payload):
        data=json.dumps(payload,ensure_ascii=False,default=str).encode('utf-8');self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data)
    def do_GET(self):
        path=self.path.split('?',1)[0]
        if path.startswith('/api/'):
            try:status,payload=route('GET',self.path);self.send_json(status,payload)
            except Exception as exc:logging.exception('GET API error');self.send_json(500,{'error':'The request could not be completed.','detail':str(exc) if settings.demo_mode else 'Internal server error.'})
            return
        if path in ('/','/index.html'):
            target=ROOT/'frontend'/'index.html'
        elif path=='/manus-routes.json':
            target=ROOT/'public'/'manus-routes.json'
        elif path.startswith('/frontend/'):
            target=ROOT/path.lstrip('/')
        else:
            self.send_json(404,{'error':'Page or asset not found.'});return
        if not target.resolve().is_relative_to(ROOT.resolve()) or not target.is_file():self.send_json(404,{'error':'Page or asset not found.'});return
        data=target.read_bytes();kind=mimetypes.guess_type(str(target))[0] or 'application/octet-stream';self.send_response(200);self.send_header('Content-Type',kind+('; charset=utf-8' if kind.startswith(('text/','application/javascript','application/json')) else ''));self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-cache');self.end_headers();self.wfile.write(data)
    def do_POST(self):
        if not self.path.startswith('/api/'):self.send_json(404,{'error':'Route not found.'});return
        try:
            size=int(self.headers.get('Content-Length','0'))
            if size>65536:self.send_json(413,{'error':'Request body exceeds 64 KB.'});return
            body=json.loads(self.rfile.read(size) or b'{}')
            if not isinstance(body,dict):self.send_json(400,{'error':'Expected a JSON object.'});return
            status,payload=route('POST',self.path,body);self.send_json(status,payload)
        except PermissionError as exc:self.send_json(403,{'error':str(exc)})
        except ValueError as exc:self.send_json(400,{'error':str(exc)})
        except Exception as exc:logging.exception('POST API error');self.send_json(500,{'error':'The request could not be completed.','detail':str(exc) if settings.demo_mode else 'Internal server error.'})
    def do_OPTIONS(self):self.send_response(204);self.send_header('Access-Control-Allow-Methods','GET, POST, OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type');self.end_headers()
def main():
    server=ThreadingHTTPServer((settings.host,settings.port),Handler);logging.info('Counterfactual Boardroom listening on %s:%s',settings.host,settings.port);logging.info('Data mode: %s','PostgreSQL' if settings.postgres_dsn else 'in-memory illustrative demo');server.serve_forever()
if __name__=='__main__':main()
