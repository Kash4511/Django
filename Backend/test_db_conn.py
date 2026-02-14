import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")
print(f"Connecting to: {db_url}")

try:
    conn = psycopg2.connect(db_url)
    print("Successfully connected to Supabase!")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
