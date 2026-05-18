import sqlite3
import os

path = r'd:\TI\Stagio-main\Stagio-main\backend1\db.sqlite3'
if not os.path.exists(path):
    print('DB_MISSING')
    raise SystemExit(1)
conn = sqlite3.connect(path)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
print('TABLES:')
for row in cur.fetchall():
    print(row[0])
print('---')
for t in ['users_customuser', 'auth_user', 'users_student', 'users_company']:
    try:
        cur.execute(f"SELECT id, email, role FROM {t} LIMIT 20")
        rows = cur.fetchall()
        if rows:
            print('TABLE', t)
            for r in rows:
                print(r)
    except Exception:
        pass
conn.close()
