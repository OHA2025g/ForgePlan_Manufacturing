"""Exercise real local persistence, conflict protection and drawing upload."""
import copy,hashlib,json,socket,subprocess,sys,tempfile,time,urllib.request,urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    base=f'http://127.0.0.1:{port}'
    def request(path,method='GET',body=None,headers=None):
        req=urllib.request.Request(base+path,body,headers or {},method=method)
        try:
            with urllib.request.urlopen(req,timeout=10) as r:return r.status,r.read(),r.headers
        except urllib.error.HTTPError as e:return e.code,e.read(),e.headers
    with tempfile.TemporaryDirectory() as tmp:
        process=subprocess.Popen([sys.executable,str(ROOT/'portable/server.py'),'--port',str(port),'--data-dir',tmp],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        try:
            for _ in range(100):
                try:status,raw,_=request('/api/workspace');break
                except urllib.error.URLError:time.sleep(.05)
            else:raise AssertionError('Server did not start.')
            assert status==200
            value=json.loads(raw);assert value['revision']==0 and value['workspace']['jobs']==[]
            w=value['workspace'];w['jobs']=[json.loads((ROOT/'portable/sample-estimate.json').read_text())['job']]
            payload=json.dumps({'workspace':w,'revision':0}).encode();headers={'Content-Type':'application/json'}
            status,raw,_=request('/api/workspace','PUT',payload,headers);assert status==200 and json.loads(raw)['revision']==1
            assert request('/api/workspace','PUT',payload,headers)[0]==409
            assert json.loads(request('/api/workspace')[1])['workspace']==w
            bad=copy.deepcopy(w);bad['jobs'][0]['quantity']=0
            assert request('/api/workspace','PUT',json.dumps({'workspace':bad,'revision':1}).encode(),headers)[0]==400
            bad=copy.deepcopy(w);bad['jobs'][0]['materials'][0]['density']=-1
            assert request('/api/workspace','PUT',json.dumps({'workspace':bad,'revision':1}).encode(),headers)[0]==400
            assert request('/api/workspace','PUT',payload,{**headers,'Origin':'https://outside.example'})[0]==403
            assert request('/api/workspace',headers={'Host':'outside.example'})[0]==403
            original=(ROOT/'public/sample/stuffing-box.pdf').read_bytes();boundary='ForgePlanTestBoundary'
            def upload(data):
                raw=(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="body.pdf"\r\nContent-Type: application/pdf\r\n\r\n'.encode()+data+f'\r\n--{boundary}--\r\n'.encode())
                return request('/api/drawings','POST',raw,{'Content-Type':f'multipart/form-data; boundary={boundary}'})
            status,raw,_=upload(original);assert status==200
            drawing=json.loads(raw);status,stored,response_headers=request(drawing['url']);assert status==200
            assert hashlib.sha256(stored).digest()==hashlib.sha256(original).digest()
            assert response_headers['Content-Type']=='application/pdf'
            assert upload(b'Invalid pretend PDF')[0]==400
            assert request('/../portable/server.py')[0]==403
            for path in ['/','/app.js','/app.css','/ocr/worker.min.js','/ocr/pdf.worker.min.mjs','/ocr/lang/eng.traineddata.gz','/ocr/core/tesseract-core-simd-lstm.wasm','/sample/stuffing-box.png']:
                status,content,_=request(path);assert status==200 and len(content)>100,(path,status)
            assert (Path(tmp)/'forgeplan.sqlite').is_file()
            print('PASS: persistence, revision conflicts, input validation, drawing round-trip, asset serving and origin/host checks.')
        finally:
            process.terminate();process.communicate(timeout=10)
if __name__=='__main__':main()
