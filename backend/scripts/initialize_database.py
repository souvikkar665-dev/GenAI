"""Apply PostgreSQL schema and seed SQL to the configured database."""
from pathlib import Path
import os

def main():
    dsn=os.environ.get('BOARDROOM_POSTGRES_DSN')
    if not dsn:raise SystemExit('Set BOARDROOM_POSTGRES_DSN in the environment; no database was changed.')
    try:import psycopg
    except ImportError as exc:raise SystemExit('Install backend/requirements.txt first.') from exc
    base=Path(__file__).resolve().parents[1]/'database'
    with psycopg.connect(dsn) as db:
        db.execute((base/'schema.sql').read_text(),prepare=False)
        db.execute((base/'seed.sql').read_text(),prepare=False)
    print('PostgreSQL schema and illustrative seed data applied.')
if __name__=='__main__':main()
