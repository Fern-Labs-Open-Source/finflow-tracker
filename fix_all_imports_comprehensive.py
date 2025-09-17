#!/usr/bin/env python3
import os
import re
from pathlib import Path

def calculate_relative_path(from_file, to_path):
    """Calculate relative path from one file to another"""
    from_path = Path(from_file).parent
    
    # Handle @/ imports
    if to_path.startswith("@/"):
        to_full = Path("src") / to_path.replace("@/", "")
    else:
        return to_path  # Don't change non-@/ imports
    
    # Calculate relative path
    rel_path = os.path.relpath(to_full, from_path)
    
    # Ensure we use forward slashes
    return rel_path.replace("\\", "/")

def fix_imports_in_file(filepath):
    """Fix all @/ imports in a single file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Find all imports with @/
    import_pattern = r"from\s+['\"](@/[^'\"]+)['\"]"
    
    modified = False
    for match in re.finditer(import_pattern, content):
        old_path = match.group(1)
        relative_path = calculate_relative_path(filepath, old_path)
        
        if relative_path != old_path:
            # Replace the import
            old_import = match.group(0)
            new_import = old_import.replace(old_path, relative_path)
            content = content.replace(old_import, new_import)
            modified = True
            print(f"  {filepath}: {old_path} -> {relative_path}")
    
    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
    
    return modified

def main():
    print("Fixing all @/ imports in the entire project...")
    
    # Find all TypeScript files in app and src directories
    all_files = []
    for directory in ["app", "src"]:
        if os.path.exists(directory):
            for root, dirs, files in os.walk(directory):
                for file in files:
                    if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                        all_files.append(os.path.join(root, file))
    
    fixed_count = 0
    for filepath in all_files:
        if fix_imports_in_file(filepath):
            fixed_count += 1
    
    print(f"\nFixed imports in {fixed_count} files")

if __name__ == "__main__":
    main()
