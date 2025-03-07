import json
import os
from pathlib import Path


swagger_dir_path = os.path.join(Path(__file__).parent.parent / 'backend' / 'docs')

def load_spec():
    with open(f"{swagger_dir_path}/swagger.json", 'r') as f:
        return json.load(f)
    
def save_spec(spec):
    with open(f"{swagger_dir_path}/swagger.orval.json",
              'w', encoding='utf-8') as f:
        json.dump(spec, f, indent=2, ensure_ascii=False)


def filter_success_responses(spec):
    """Swaggerのレスポンスを正常系のみにフィルタリング"""
    for path, methods in spec.get("paths", {}).items():
        for method, details in methods.items():
            if "responses" in details:
                # 200番台のレスポンスのみ残す
                details["responses"] = {k: v for k, v in details["responses"].items() if k.startswith("2")}
    return spec
    

if __name__ == '__main__':
    spec = load_spec()
    spec = filter_success_responses(spec)
    save_spec(spec)
