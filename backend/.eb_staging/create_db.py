# create_db.py
import os
from dotenv import load_dotenv
import psycopg

load_dotenv()  # lee backend/.env

HOST = os.getenv("DB_HOST")
PORT = os.getenv("DB_PORT", "5432")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
TARGET_DB = os.getenv("DB_NAME", "condominio")
SSLMODE = os.getenv("DB_SSLMODE", "require")

with psycopg.connect(
    host=HOST, port=PORT, dbname="postgres",
    user=USER, password=PASSWORD, sslmode=SSLMODE
) as conn:
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (TARGET_DB,))
        if cur.fetchone():
            print(f"✔ La base '{TARGET_DB}' ya existe.")
        else:
            cur.execute(f'CREATE DATABASE "{TARGET_DB}"')
            print(f"✅ Base '{TARGET_DB}' creada en RDS.")
