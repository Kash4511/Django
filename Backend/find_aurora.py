import os
import re

def find_imports(directory):
    pattern = re.compile(r'(import\s+aurora|from\s+aurora\s+import)')
    matches = []
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if pattern.search(content):
                            matches.append((file_path, content))
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    return matches

if __name__ == "__main__":
    directory = os.path.dirname(os.path.abspath(__file__))
    matches = find_imports(directory)
    
    if matches:
        print(f"Found {len(matches)} files with Aurora imports:")
        for file_path, content in matches:
            print(f"\n{file_path}:")
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if re.search(r'(import\s+aurora|from\s+aurora\s+import)', line):
                    print(f"  Line {i+1}: {line.strip()}")
    else:
        print("No Aurora imports found in Python files.")