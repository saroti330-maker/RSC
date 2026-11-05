#!/usr/bin/env python3
"""
School Wise Student Database Manager (SQLite CLI)
Run this script to inspect, query, export or manage 'database.db'.
Usage:
    python manage_db.py stats
    python manage_db.py schools
    python manage_db.py search <name or village or id>
    python manage_db.py export-json
"""

import sqlite3
import sys
import os
import json

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")

def get_conn():
    if not os.path.exists(DB_FILE):
        print(f"Error: {DB_FILE} does not exist. Run init_db.py first.")
        sys.exit(1)
    return sqlite3.connect(DB_FILE)

def stats():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM schools")
    sc = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM students")
    st = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM students WHERE gender = 'M'")
    boys = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM students WHERE gender = 'F'")
    girls = cur.fetchone()[0]
    cur.execute("SELECT count(DISTINCT village) FROM students")
    villages = cur.fetchone()[0]
    cur.execute("SELECT AVG(income_bdt) FROM students")
    avg_income = cur.fetchone()[0] or 0
    cur.execute("SELECT count(*) FROM audit_logs")
    logs = cur.fetchone()[0]
    conn.close()

    print("=" * 60)
    print("📊 স্কুল ভিত্তিক শিক্ষার্থী ডাটাবেজ পরিসংখ্যান (database.db)")
    print("=" * 60)
    print(f"🏫 মোট শিক্ষা প্রতিষ্ঠান: {sc} টি")
    print(f"🎓 মোট শিক্ষার্থী: {st} জন")
    print(f"👦 ছাত্র (Boys): {boys} জন ({(boys/st*100):.1f}%)")
    print(f"👧 ছাত্রী (Girls): {girls} জন ({(girls/st*100):.1f}%)")
    print(f"🏡 মোট গ্রাম / এলাকা: {villages} টি")
    print(f"💰 গড় মাসিক আয়: ৳{avg_income:,.0f} BDT")
    print(f"📝 মোট অডিট লগ রেকর্ড: {logs} টি")
    print(f"💾 ফাইল পাথ: {DB_FILE}")
    print(f"📦 ফাইল সাইজ: {os.path.getsize(DB_FILE):,} bytes")
    print("=" * 60)

def list_schools():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT num, name_bn, total_students, boys_count, girls_count FROM schools ORDER BY num")
    rows = cur.fetchall()
    conn.close()

    print("=" * 70)
    print(f"{'ক্র.':<4} {'প্রতিষ্ঠানের নাম':<45} {'মোট':<6} {'ছাত্র':<6} {'ছাত্রী':<6}")
    print("-" * 70)
    for r in rows:
        print(f"{r[0]:<4} {r[1]:<45} {r[2]:<6} {r[3]:<6} {r[4]:<6}")
    print("=" * 70)

def search(query):
    conn = get_conn()
    cur = conn.cursor()
    q = f"%{query}%"
    cur.execute("""
        SELECT id, name, gender, class_name, village, school_bn, mobile, income_bdt
        FROM students
        WHERE name LIKE ? OR id LIKE ? OR village LIKE ? OR school_bn LIKE ?
        ORDER BY school_num, id
    """, (q, q, q, q))
    rows = cur.fetchall()
    conn.close()

    print(f"🔎 সার্চ রেজাল্ট: '{query}' ({len(rows)} টি রেকর্ড পাওয়া গেছে)")
    print("-" * 80)
    for r in rows:
        gender_icon = '👦' if r[2] == 'M' else '👧'
        print(f"[{r[0]}] {gender_icon} {r[1]} | শ্রেণি: {r[3]} | গ্রাম: {r[4]} | প্রতিষ্ঠান: {r[5]} | মোবাইল: {r[6]} | আয়: ৳{r[7]:,.0f}")
    print("-" * 80)

def export_json():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT num, name_bn, name_en, file_name, total_students, boys_count, girls_count FROM schools ORDER BY num")
    schools_rows = cur.fetchall()

    export_data = []
    for s in schools_rows:
        cur.execute("SELECT * FROM students WHERE school_num = ? ORDER BY id", (s[0],))
        cols = [col[0] for col in cur.description]
        students = [dict(zip(cols, row)) for row in cur.fetchall()]
        export_data.append({
            'num': s[0],
            'name_bn': s[1],
            'name_en': s[2],
            'file_name': s[3],
            'total_students': s[4],
            'boys_count': s[5],
            'girls_count': s[6],
            'students': students
        })

    out_file = os.path.join(os.path.dirname(DB_FILE), "exported_database.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)

    conn.close()
    print(f"✅ ডাটাবেজ সফলভাবে এক্সপোর্ট হয়েছে: {out_file}")

if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] == 'stats':
        stats()
    elif sys.argv[1] == 'schools':
        list_schools()
    elif sys.argv[1] == 'search':
        q = sys.argv[2] if len(sys.argv) > 2 else ''
        search(q)
    elif sys.argv[1] == 'export-json':
        export_json()
    else:
        print("Usage: python manage_db.py [stats|schools|search <term>|export-json]")

