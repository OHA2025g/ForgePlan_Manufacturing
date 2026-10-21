#!/usr/bin/env python3
"""ForgePlan single-workshop local server. Python standard library only."""
from __future__ import annotations
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
from email.parser import BytesParser
from email import policy
import argparse,json,sqlite3,mimetypes,uuid,webbrowser,math,re
from urllib.parse import urlsplit,unquote,quote

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'workshop-data'
MAX_UPLOAD=15*1024*1024
def connection():
    c=sqlite3.connect(DATA/'forgeplan.sqlite',timeout=15)
    c.execute('PRAGMA journal_mode=WAL')
    return c
def initialise():
    (DATA/'drawings').mkdir(parents=True,exist_ok=True)
    with connection() as c:
        c.execute('CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY,data TEXT NOT NULL,revision INTEGER NOT NULL)')
        c.execute('CREATE TABLE IF NOT EXISTS drawings (id TEXT PRIMARY KEY,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL)')
def finite(v):return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v) and v>=0
def validate(w):
    if not isinstance(w,dict):raise ValueError('Invalid workspace.')
    for key in ('materials','machines','jobs'):
        if not isinstance(w.get(key),list) or len(w[key])>100:raise ValueError('Invalid workspace collection.')
        ids=set()
        for item in w[key]:
            if not isinstance(item,dict) or not isinstance(item.get('id'),str) or not item['id'] or item['id'] in ids or not isinstance(item.get('name'),str) or not item['name'].strip():raise ValueError('Invalid or duplicate record identity.')
            ids.add(item['id'])
    for m in w['materials']:
        if any(not isinstance(m.get(k),str) for k in ('grade','notes')):raise ValueError('Invalid material text.')
        if not isinstance(m,dict):raise ValueError('Invalid material.')
        if not m.get('id') or not m.get('name') or not all(finite(m.get(k)) for k in ('density','rate','scrapRate','machiningFactor')) or m['density']<=0 or m['machiningFactor']<=0:raise ValueError('Invalid material properties.')
    for m in w['machines']:
        if m.get('type') not in ('cutting','vmc','mill','drill','lathe','finishing','inspection') or type(m.get('enabled')) is not bool or not isinstance(m.get('notes'),str):raise ValueError('Invalid machine category or availability.')
        if not isinstance(m,dict):raise ValueError('Invalid machine.')
        if not m.get('id') or not m.get('name') or not all(finite(m.get(k)) for k in ('rate','setup','mrr','feed','x','y','z')) or any(m[k]<=0 for k in ('mrr','feed','x','y','z')):raise ValueError('Invalid machine properties.')
    for j in w['jobs']:
        if not isinstance(j,dict):raise ValueError('Invalid estimate.')
        if not j.get('id') or not j.get('name') or type(j.get('quantity')) is not int or not 1<=j['quantity']<=100000 or not isinstance(j.get('parts'),list) or len(j['parts'])>100:raise ValueError('Invalid estimate.')
        if j.get('unit')!='mm' or j.get('route') not in ('vmc','conventional'):raise ValueError('Invalid units or route.')
        if not isinstance(j.get('pricing'),dict) or not all(finite(j['pricing'].get(k)) for k in ('tooling','assemblyPerUnit','finishingPerUnit','packagingPerUnit','overhead','markup','tax','scrapRecovery')):raise ValueError('Invalid pricing.')
        if any(j['pricing'][k]>100 for k in ('overhead','tax','scrapRecovery')):raise ValueError('Pricing percentages must not exceed 100.')
        if not isinstance(j.get('materials'),list) or not isinstance(j.get('machines'),list) or not isinstance(j.get('overrides'),dict):raise ValueError('Invalid estimate catalogue.')
        validate({'materials':j['materials'],'machines':j['machines'],'jobs':[]})
        for k in ('reference','customer','scope','drawingUrl','drawingName','updatedAt'):
            if not isinstance(j.get(k),str):raise ValueError('Invalid estimate text.')
        if j['drawingUrl'] and not re.fullmatch(r'(?:/sample/stuffing-box\.pdf|/api/drawings/[a-zA-Z0-9-]+|local:[a-zA-Z0-9-]+)',j['drawingUrl']):raise ValueError('Invalid drawing reference.')
        for o in j['overrides'].values():
            if not isinstance(o,dict) or any(k in o and not finite(o[k]) for k in ('minutes','setup')):raise ValueError('Invalid operation override.')
        part_ids=set()
        for p in j['parts']:
            if not isinstance(p,dict):raise ValueError('Invalid component.')
            if not isinstance(p.get('id'),str) or not p['id'] or p['id'] in part_ids or not isinstance(p.get('name'),str) or not p['name'].strip() or any(not isinstance(p.get(k),str) for k in ('materialId','tolerance','notes')) or type(p.get('reviewed')) is not bool:raise ValueError('Invalid component properties.')
            part_ids.add(p['id'])
            if p.get('stockKind') not in ('block','cylinder','tube'):raise ValueError('Invalid raw stock form.')
            if p.get('kind') not in ('block','cylinder','tube','profile','purchased') or not isinstance(p.get('features'),list) or len(p['features'])>100:raise ValueError('Invalid component.')
            for k in ('count','length','width','thickness','diameter','innerDiameter','profileArea','purchasedWeight','purchasedCost','stockLength','stockWidth','stockThickness','stockDiameter','stockInnerDiameter','allocation'):
                if not finite(p.get(k)):raise ValueError('Invalid component dimension.')
            if type(p.get('count')) is not int or p['count']<1:raise ValueError('Invalid component quantity.')
            feature_ids=set()
            for f in p['features']:
                if not isinstance(f,dict) or f.get('type') not in ('bore','counterbore','thread','pocket') or type(f.get('count')) is not int or f['count']<1:raise ValueError('Invalid feature.')
                if not isinstance(f.get('id'),str) or not f['id'] or f['id'] in feature_ids or not isinstance(f.get('name'),str) or not f['name'].strip() or not isinstance(f.get('source'),str):raise ValueError('Invalid feature identity.')
                feature_ids.add(f['id'])
                if not all(finite(f.get(k)) for k in ('diameter','coreDiameter','depth','count','length','width')):raise ValueError('Invalid feature dimension.')

class Handler(BaseHTTPRequestHandler):
    server_version='ForgePlan/1.0'
    def log_message(self,*args):pass
    def trusted(self):
        host=urlsplit('http://'+self.headers.get('Host','')).hostname
        if host not in ('localhost','127.0.0.1','::1'):self.send_json({'error':'Host is not allowed.'},403);return False
        origin=self.headers.get('Origin')
        if origin and origin!='http://'+self.headers.get('Host',''):self.send_json({'error':'Request origin is not allowed.'},403);return False
        return True
    def send_json(self,value,status=200):
        data=json.dumps(value,allow_nan=False).encode()
        self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(data)
    def body(self,limit):
        length=int(self.headers.get('Content-Length','0'))
        if length<=0 or length>limit:raise ValueError('Request size exceeds the allowed limit.')
        return self.rfile.read(length)
    def send_file(self,path,mime=None,name=None):
        if not path.is_file():self.send_error(404);return
        data=path.read_bytes();self.send_response(200);self.send_header('Content-Type',mime or mimetypes.guess_type(str(path))[0] or 'application/octet-stream');self.send_header('Content-Length',str(len(data)));self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cache-Control','no-cache')
        if name:self.send_header('Content-Disposition',"inline; filename*=UTF-8''"+quote(name))
        self.end_headers();self.wfile.write(data)
    def do_GET(self):
        if not self.trusted():return
        path=unquote(urlsplit(self.path).path)
        try:
            if path=='/api/workspace':
                with connection() as c:row=c.execute('SELECT data,revision FROM workspace WHERE id=1').fetchone()
                self.send_json({'workspace':json.loads(row[0]) if row else json.loads((ROOT/'portable/default-workspace.json').read_text()),'revision':row[1] if row else 0});return
            if path.startswith('/api/drawings/'):
                identifier=path.rsplit('/',1)[-1]
                try:uuid.UUID(identifier)
                except ValueError:self.send_error(404);return
                with connection() as c:row=c.execute('SELECT name,mime FROM drawings WHERE id=?',(identifier,)).fetchone()
                if not row:self.send_error(404);return
                self.send_file(DATA/'drawings'/identifier,row[1],row[0]);return
            base=ROOT/'public' if path.startswith(('/ocr/','/sample/')) or path=='/favicon.svg' else ROOT/'webapp'
            relative='index.html' if path=='/' else path.lstrip('/')
            target=(base/relative).resolve()
            if not target.is_relative_to(base.resolve()):self.send_error(403);return
            self.send_file(target)
        except Exception:self.send_json({'error':'Unable to load this resource.'},500)
    def do_PUT(self):
        if not self.trusted():return
        if urlsplit(self.path).path!='/api/workspace':self.send_error(404);return
        try:
            data=json.loads(self.body(1500000));w=data.get('workspace');rev=data.get('revision');validate(w)
            if type(rev) is not int or rev<0:raise ValueError('Invalid workspace revision.')
            with connection() as c:
                c.execute('BEGIN IMMEDIATE');row=c.execute('SELECT revision FROM workspace WHERE id=1').fetchone();current=row[0] if row else 0
                if rev!=current:self.send_json({'error':'Another session updated this workspace. Export your draft and reload before merging changes.'},409);return
                c.execute('INSERT INTO workspace (id,data,revision) VALUES (1,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,revision=excluded.revision',(json.dumps(w,allow_nan=False),rev+1))
            self.send_json({'revision':rev+1})
        except (ValueError,TypeError,KeyError) as e:self.send_json({'error':str(e)},400)
        except Exception:self.send_json({'error':'Unable to save. Your input remains available; retry or export JSON.'},503)
    def do_POST(self):
        if not self.trusted():return
        if urlsplit(self.path).path!='/api/drawings':self.send_error(404);return
        try:
            content_type=self.headers.get('Content-Type','')
            if not content_type.startswith('multipart/form-data;'):raise ValueError('Choose a supported drawing file.')
            raw=self.body(MAX_UPLOAD+65536)
            msg=BytesParser(policy=policy.default).parsebytes(('Content-Type: '+content_type+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw)
            parts=list(msg.iter_parts()) if msg.is_multipart() else []
            part=next((p for p in parts if p.get_param('name',header='content-disposition')=='file'),None)
            if part is None:raise ValueError('No drawing file provided.')
            payload=part.get_payload(decode=True);name=(part.get_filename() or 'drawing')[:250]
            if not payload or len(payload)>MAX_UPLOAD:raise ValueError('Choose a drawing up to 15 MB.')
            mime='application/pdf' if payload.startswith(b'%PDF') else 'image/png' if payload.startswith(b'\x89PNG') else 'image/jpeg' if payload.startswith(b'\xff\xd8\xff') else ''
            if not mime:raise ValueError('Choose a valid PDF, PNG or JPEG.')
            identifier=str(uuid.uuid4());target=DATA/'drawings'/identifier;target.write_bytes(payload)
            try:
                with connection() as c:c.execute('INSERT INTO drawings (id,name,mime,size) VALUES (?,?,?,?)',(identifier,name,mime,len(payload)))
            except Exception:target.unlink(missing_ok=True);raise
            self.send_json({'id':identifier,'url':'/api/drawings/'+identifier,'name':name,'mime':mime})
        except (ValueError,TypeError) as e:self.send_json({'error':str(e)},400)
        except Exception:self.send_json({'error':'Drawing could not be saved. Please retry.'},503)

def main():
    global DATA
    parser=argparse.ArgumentParser(description='Start the private ForgePlan workshop platform.');parser.add_argument('--host',default='127.0.0.1');parser.add_argument('--port',type=int,default=8080);parser.add_argument('--open',action='store_true');parser.add_argument('--data-dir',type=Path,default=DATA);args=parser.parse_args();DATA=args.data_dir.resolve();initialise()
    server=ThreadingHTTPServer((args.host,args.port),Handler)
    shown='127.0.0.1' if args.host in ('0.0.0.0','::') else args.host
    print(f'ForgePlan is ready at http://{shown}:{args.port}',flush=True)
    print('Your estimates and drawings are kept in workshop-data. Keep this window open. Press Ctrl+C to stop.',flush=True)
    if args.open:webbrowser.open(f'http://127.0.0.1:{args.port}')
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
