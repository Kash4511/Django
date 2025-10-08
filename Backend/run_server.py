#!/usr/bin/env python
"""Custom script to run Django server with correct settings and migrations."""
import os
import sys
import subprocess

def run_django_command(command):
    """Run a Django management command with the correct environment."""
    # Set the correct Django settings module
    os.environ['DJANGO_SETTINGS_MODULE'] = 'django_project.settings'
    
    # Remove any paths that might be causing conflicts
    sys_path_copy = sys.path.copy()
    filtered_paths = [p for p in sys_path_copy if 'ProjectKaizen' not in p and 'aurora' not in p]
    sys.path = filtered_paths
    
    # Run the Django command
    result = subprocess.run([sys.executable, 'manage.py'] + command, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print("Errors:", result.stderr)
    return result.returncode == 0

if __name__ == "__main__":
    # First run migrations
    print("Making migrations...")
    run_django_command(['makemigrations'])
    
    print("\nApplying migrations...")
    run_django_command(['migrate'])
    
    # Then run the server
    print("\nStarting Django server...")
    # For the server, we don't capture output so it streams normally
    os.environ['DJANGO_SETTINGS_MODULE'] = 'django_project.settings'
    sys_path_copy = sys.path.copy()
    filtered_paths = [p for p in sys_path_copy if 'ProjectKaizen' not in p and 'aurora' not in p]
    sys.path = filtered_paths
    
    subprocess.run([sys.executable, 'manage.py', 'runserver'])