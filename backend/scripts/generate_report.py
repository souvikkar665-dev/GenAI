"""Print a compact JSON snapshot from the local API for operational review."""
import json
from urllib.request import urlopen

def main():
    with urlopen('http://127.0.0.1:3000/api/portfolio',timeout=4) as response:
        print(json.dumps(json.loads(response.read()),indent=2,ensure_ascii=False))
if __name__=='__main__':main()
