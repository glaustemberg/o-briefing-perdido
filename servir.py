"""Servidor local do jogo. O http.server padrao atende uma requisicao por vez, e o jogo pede quase 90
arquivos no boot (48 vozes mais os sprites e tiles), o que fazia a tela CARREGANDO levar quase 30 s.
Uso: python servir.py [porta]"""
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class SemCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')   # evita o navegador servir js velho depois de editar
        super().end_headers()
    def log_message(self, *a): pass

if __name__ == '__main__':
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f'jogo em http://localhost:{porta}')
    ThreadingHTTPServer(('', porta), SemCache).serve_forever()
