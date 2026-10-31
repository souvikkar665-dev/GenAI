"""Initialize local SQLite demo and show an aggregate. No AWS/model calls occur."""
from pathlib import Path
import sqlite3
from services.analytics_service import AnalyticsEngine
BASE=Path(__file__).resolve().parent
DB=BASE/'database'/'boardroom.db'
def main():
    with sqlite3.connect(DB) as db:
        db.executescript((BASE/'database'/'schema.sql').read_text())
        db.executescript((BASE/'database'/'seed.sql').read_text())
    print(AnalyticsEngine(DB).portfolio_summary('org-demo'))
if __name__=='__main__': main()
