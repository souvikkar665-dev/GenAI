# PostgreSQL setup

PostgreSQL is the only persistent database target. The browser app defaults to an in-memory, illustrative demo and does not create a SQLite file. To use PostgreSQL, create a database and apply `schema.sql` followed by `seed.sql`. The seed contains synthetic example values and is not a trained model forecast.

Set `BOARDROOM_POSTGRES_DSN` in the server environment to a PostgreSQL connection string. Install `backend/requirements.txt` in the Python environment first. Keep the DSN outside source control. A real deployment should use a managed secret store and restricted PostgreSQL credentials. `main.py` will verify the connection; it does not run schema migrations automatically.
