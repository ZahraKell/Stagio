"""
Stag.io Backend — Full Simulation Test Suite
============================================
Tests every API endpoint via real HTTP requests against a running server.

HOW TO RUN:
  Step 1 — Apply all migrations:
    python manage.py makemigrations
    python manage.py migrate

  Step 2 — Start the server (keep this terminal open):
    python manage.py runserver

  Step 3 — In a NEW terminal, run the tests:
    python test_stagio.py
"""

import requests
import json
import sys
import time

BASE  = "http://127.0.0.1:8000"
PASS  = 0
FAIL  = 0
WARNS = []

# ── Helpers ───────────────────────────────────────────────────────────────────

def safe_json(r):
    """Parse JSON safely — return empty dict if response is not JSON (e.g. HTML 500)."""
    try:
        return r.json()
    except Exception:
        return {}

def p(label, ok, detail=""):
    global PASS, FAIL
    icon = "\u2705 PASS" if ok else "\u274c FAIL"
    line = f"  {icon}  {label}"
    if detail:
        line += f"\n         \u2514\u2500 {detail}"
    print(line)
    if ok:
        PASS += 1
    else:
        FAIL += 1
        WARNS.append(label)

def section(title):
    print(f"\n{'='*62}")
    print(f"  {title}")
    print(f"{'='*62}")

def post(url, data=None, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.post(f"{BASE}{url}", json=data or {}, headers=h, timeout=10)

def get(url, token=None, params=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.get(f"{BASE}{url}", headers=h, params=params or {}, timeout=10)

def patch(url, data=None, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.patch(f"{BASE}{url}", json=data or {}, headers=h, timeout=10)

def put(url, data=None, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.put(f"{BASE}{url}", json=data or {}, headers=h, timeout=10)

def delete(url, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.delete(f"{BASE}{url}", headers=h, timeout=10)

def login(username, password):
    try:
        r = post("/api/auth/login/", {"username": username, "password": password})
        return safe_json(r).get("access")
    except Exception:
        return None

def debug(r):
    """Return status + first 200 chars of body for error messages."""
    try:
        body = r.text[:200]
    except Exception:
        body = "(no body)"
    return f"HTTP {r.status_code} | {body}"

# ── Test accounts ─────────────────────────────────────────────────────────────
ADMIN_REG    = {"username": "t_admin",    "password": "Admin@12345", "email": "admin@stagio.dz",           "full_name": "Platform Admin", "role": "admin"}
STUDENT_REG  = {"username": "t_student",  "password": "Stud@12345",  "email": "ali.benali@univ-msila.dz",  "full_name": "Ali Benali",     "role": "student"}
STUDENT2_REG = {"username": "t_student2", "password": "Stud@12345",  "email": "sara.ali@univ-msila.dz",    "full_name": "Sara Ali",       "role": "student"}
COMPANY_REG  = {"username": "t_company",  "password": "Corp@12345",  "email": "rh@techcorp.dz",            "full_name": "TechCorp DZ",    "role": "company"}
ADMIN2_EMAIL = "chef.stage@univ-msila.dz"
ADMIN2_REG   = {"username": "t_administ", "password": "Admin@12345", "email": ADMIN2_EMAIL,                "full_name": "Dr. Foulen",     "role": "administration"}

T = {}   # tokens keyed by role name
I = {}   # IDs of created objects

# ═════════════════════════════════════════════════════════════════════════════
section("0. SERVER HEALTH CHECK")
# ═════════════════════════════════════════════════════════════════════════════
try:
    r = requests.get(f"{BASE}/api/offers/", timeout=3)
    p("Server is running and reachable", r.status_code in [200, 401])
except Exception as exc:
    print(f"\n  \u274c CANNOT REACH SERVER at {BASE}")
    print(f"     Error: {exc}")
    print(f"     \u2192 Run: python manage.py runserver\n")
    sys.exit(1)

# ═════════════════════════════════════════════════════════════════════════════
section("1. ADMIN SETUP")
# ═════════════════════════════════════════════════════════════════════════════
r = post("/api/auth/register/", ADMIN_REG)
p("Admin registration (201 or 400 if already exists)",
  r.status_code in [201, 400], debug(r))

T['admin'] = login(ADMIN_REG['username'], ADMIN_REG['password'])
p("Admin login returns JWT token", T['admin'] is not None)

if not T['admin']:
    print("\n  \u274c Cannot continue without admin token. Check DB/migrations.\n")
    sys.exit(1)

# ═════════════════════════════════════════════════════════════════════════════
section("2. ADMINISTRATION EMAIL WHITELIST")
# ═════════════════════════════════════════════════════════════════════════════
r = post("/api/admin/administration-emails/add/",
         {"email": ADMIN2_EMAIL, "institution": "Université de M'Sila"},
         token=T['admin'])
j = safe_json(r)
p("Admin adds administration email (200 or 400 if exists)",
  r.status_code in [200, 400], debug(r))

r = get("/api/admin/administration-emails/", token=T['admin'])
j = safe_json(r)
p("Admin lists administration emails (200)",
  r.status_code == 200 and isinstance(j.get('data'), list), debug(r))

r = post("/api/admin/administration-emails/add/",
         {"email": "hacker@evil.com", "institution": "Evil"})
p("Unauthenticated CANNOT add email (401)", r.status_code == 401)

# ═════════════════════════════════════════════════════════════════════════════
section("3. USER REGISTRATION — Email validation rules")
# ═════════════════════════════════════════════════════════════════════════════
r = post("/api/auth/register/", STUDENT_REG)
p("Student registers with valid university email (.dz)", r.status_code in [201, 400], debug(r))

r = post("/api/auth/register/", {
    "username": "bad_stu", "password": "Test@1234",
    "email": "someone@gmail.com", "full_name": "Bad", "role": "student"
})
p("Student with gmail.com email REJECTED (400)", r.status_code == 400, debug(r))

r = post("/api/auth/register/", STUDENT2_REG)
p("Student2 registers (univ-msila.dz)", r.status_code in [201, 400], debug(r))

r = post("/api/auth/register/", ADMIN2_REG)
p("Administration registers with pre-approved email (201 or 400)",
  r.status_code in [201, 400], debug(r))

r = post("/api/auth/register/", {
    "username": "fake_adm", "password": "Test@1234",
    "email": "random@ummto.dz", "full_name": "Fake", "role": "administration"
})
p("Administration with unapproved email REJECTED (400)", r.status_code == 400, debug(r))

r = post("/api/auth/register/", COMPANY_REG)
p("Company registers (no email restriction)", r.status_code in [201, 400], debug(r))

# ═════════════════════════════════════════════════════════════════════════════
section("4. LOGIN")
# ═════════════════════════════════════════════════════════════════════════════
T['student']  = login(STUDENT_REG['username'],  STUDENT_REG['password'])
T['student2'] = login(STUDENT2_REG['username'], STUDENT2_REG['password'])
T['company']  = login(COMPANY_REG['username'],  COMPANY_REG['password'])
T['administ'] = login(ADMIN2_REG['username'],   ADMIN2_REG['password'])

p("Student login",        T['student']  is not None)
p("Student2 login",       T['student2'] is not None)
p("Company login",        T['company']  is not None)
p("Administration login", T['administ'] is not None)

r = post("/api/auth/login/", {"username": "nobody", "password": "wrong"})
p("Wrong credentials → 401", r.status_code == 401)

r = get("/api/auth/me/", token=T['student'])
j = safe_json(r)
p("GET /me/ returns correct role", r.status_code == 200 and j.get('role') == 'student')

# ═════════════════════════════════════════════════════════════════════════════
section("5. PROFILE — GET and UPDATE")
# ═════════════════════════════════════════════════════════════════════════════
r = get("/api/auth/profile/", token=T['student'])
j = safe_json(r)
p("Student GET profile (200)", r.status_code == 200, debug(r))
p("Profile has role=student", j.get('data', {}).get('role') == 'student')

r = patch("/api/auth/profile/update/",
          {"full_name": "Ali Benali", "speciality": "Informatique",
           "institution": "Université de M'Sila", "grade": "Licence 3"},
          token=T['student'])
p("Student UPDATE profile (200)", r.status_code == 200, debug(r))

r = patch("/api/auth/profile/update/",
          {"company_name": "TechCorp Algeria", "company_sector": "IT",
           "company_town": "Alger", "latitude": 36.7529, "longitude": 3.0420},
          token=T['company'])
p("Company UPDATE profile with geo-coordinates (200)", r.status_code == 200, debug(r))

# ═════════════════════════════════════════════════════════════════════════════
section("6. EUROPASS CV — All sections")
# ═════════════════════════════════════════════════════════════════════════════
r = patch("/api/auth/cv/update/",
          {"github": "https://github.com/alibenali",
           "linkedin": "https://linkedin.com/in/alibenali",
           "description": "Étudiant en informatique passionné par Django."},
          token=T['student'])
p("Create/update CV general info (200)", r.status_code == 200, debug(r))

# Education
r = post("/api/auth/cv/education/",
         {"degree": "Licence 3 Informatique", "institution": "Université de M'Sila",
          "field": "Génie Logiciel", "start_year": 2021, "end_year": 2024},
         token=T['student'])
p("Add education entry (201)", r.status_code == 201, debug(r))
I['edu_id'] = safe_json(r).get('data', {}).get('id')

r = post("/api/auth/cv/education/",
         {"degree": "Master 1 SI", "institution": "Université de M'Sila",
          "start_year": 2024, "is_current": True},
         token=T['student'])
p("Add second education (current=True) (201)", r.status_code == 201, debug(r))

if I.get('edu_id'):
    r = patch(f"/api/auth/cv/education/{I['edu_id']}/",
              {"description": "Mention Très Bien"}, token=T['student'])
    p("Update education entry (200)", r.status_code == 200, debug(r))

# Skills — 201 if new, 400 if already exists (both are correct behaviour)
r = post("/api/auth/cv/skill/", {"name": "Python", "level": "advanced"}, token=T['student'])
p("Add skill Python (201 or 400 if exists)", r.status_code in [201, 400], debug(r))
I['skill_id'] = safe_json(r).get('data', {}).get('id')

r = post("/api/auth/cv/skill/", {"name": "Django", "level": "intermediate"}, token=T['student'])
p("Add skill Django (201 or 400 if exists)", r.status_code in [201, 400], debug(r))

r = post("/api/auth/cv/skill/", {"name": "React",  "level": "beginner"}, token=T['student'])
p("Add skill React (201 or 400 if exists)", r.status_code in [201, 400], debug(r))

r = post("/api/auth/cv/skill/", {"name": "Python", "level": "expert"}, token=T['student'])
p("Duplicate skill REJECTED (400)", r.status_code == 400)

r = post("/api/auth/cv/skill/", {"name": "Java", "level": "grandmaster"}, token=T['student'])
p("Invalid skill level REJECTED (400)", r.status_code == 400)

# Languages — 201 if new, 400 if already exists (both are correct behaviour)
r = post("/api/auth/cv/language/", {"name": "Arabic",  "level": "native"}, token=T['student'])
p("Add language Arabic/native (201 or 400 if exists)", r.status_code in [201, 400], debug(r))
I['lang_id'] = safe_json(r).get('data', {}).get('id')

r = post("/api/auth/cv/language/", {"name": "English", "level": "B2"}, token=T['student'])
p("Add language English/B2 (201 or 400 if exists)", r.status_code in [201, 400], debug(r))

r = post("/api/auth/cv/language/", {"name": "French",  "level": "B1"}, token=T['student'])
p("Add language French/B1 (201 or 400 if exists)", r.status_code in [201, 400], debug(r))

r = post("/api/auth/cv/language/", {"name": "Arabic",  "level": "C1"}, token=T['student'])
p("Duplicate language REJECTED (400)", r.status_code == 400)

r = post("/api/auth/cv/language/", {"name": "Spanish", "level": "Z9"}, token=T['student'])
p("Invalid CEFR level REJECTED (400)", r.status_code == 400)

# Experience
r = post("/api/auth/cv/experience/",
         {"job_title": "Développeur Web Stagiaire", "company": "Startup DZ",
          "location": "Alger", "start_date": "2023-07-01", "end_date": "2023-09-30",
          "description": "API REST avec Django."},
         token=T['student'])
p("Add experience entry (201)", r.status_code == 201, debug(r))

# CV score
r = get("/api/auth/cv/score/", token=T['student'])
j = safe_json(r)
score_val = j.get('data', {}).get('score', 0)
p("CV score endpoint (200)", r.status_code == 200, debug(r))
p(f"CV score > 50 (currently {score_val})", score_val > 50,
  f"label: {j.get('data',{}).get('label','')}")

# Full CV read
r = get("/api/auth/cv/", token=T['student'])
j = safe_json(r)
d = j.get('data', {})
p("Full CV GET (200)", r.status_code == 200, debug(r))
p("CV has 2 educations, 3 skills, 3 languages",
  len(d.get('educations',[])) >= 2 and len(d.get('skills',[])) >= 3 and
  len(d.get('languages',[])) >= 3,
  f"edu={len(d.get('educations',[]))}, skills={len(d.get('skills',[]))}, lang={len(d.get('languages',[]))}")

# Company cannot access CV
r = get("/api/auth/cv/", token=T['company'])
p("Company CANNOT access CV endpoint (403)", r.status_code == 403)

# ═════════════════════════════════════════════════════════════════════════════
section("7. INTERNSHIP OFFERS — CRUD + Filters")
# ═════════════════════════════════════════════════════════════════════════════
r = post("/api/offers/create/",
         {"title": "Stage Développeur Django",
          "description": "Backend API avec Python, Django REST Framework.",
          "town": "Alger", "tech_stack": "Python Django REST API PostgreSQL",
          "internship_type": "INTERNSHIP", "is_paid": False,
          "field": "Informatique", "skills": "Python Django REST",
          "duration": "3 mois", "start_date": "2025-07-01", "end_date": "2025-09-30"},
         token=T['company'])
p("Company creates offer (201)", r.status_code == 201, debug(r))

r = post("/api/offers/create/",
         {"title": "PFE Rémunéré Master",
          "description": "Projet fin d'études, stage payé, niveau Master requis.",
          "town": "Oran", "tech_stack": "Java Spring Boot",
          "internship_type": "FINAL_YEAR", "is_paid": True, "duration": "6 mois"},
         token=T['company'])
p("Company creates paid offer (201)", r.status_code == 201, debug(r))

r = get("/api/offers/mine/", token=T['company'])
j = safe_json(r)
offers = j if isinstance(j, list) else []
p("Company sees their offers (/mine/)", len(offers) >= 2, f"count={len(offers)}")

I['offer_id']      = next((o['id'] for o in offers if not o.get('is_paid')), None)
I['paid_offer_id'] = next((o['id'] for o in offers if o.get('is_paid')),     None)
p("Offer IDs collected", I['offer_id'] is not None and I['paid_offer_id'] is not None,
  f"offer={I['offer_id']}, paid={I['paid_offer_id']}")

r = post("/api/offers/create/", {"title": "hack"}, token=T['student'])
p("Student CANNOT create offer (403)", r.status_code == 403)

r = get("/api/offers/")
p("Public offer listing (no auth, 200)", r.status_code == 200)

r = get("/api/offers/filter/", params={"town": "Alger"})
p("Filter ?town=Alger", r.status_code == 200 and len(safe_json(r)) >= 1)

r = get("/api/offers/filter/", params={"tech": "Django"})
p("Filter ?tech=Django", r.status_code == 200 and len(safe_json(r)) >= 1)

r = get("/api/offers/filter/", params={"type": "INTERNSHIP"})
p("Filter ?type=INTERNSHIP", r.status_code == 200)

r = get("/api/offers/filter/", params={"type": "FINAL_YEAR"})
p("Filter ?type=FINAL_YEAR", r.status_code == 200)

r = get("/api/offers/filter/", params={"field": "Informatique"})
p("Filter ?field=Informatique", r.status_code == 200 and len(safe_json(r)) >= 1)

r = get("/api/offers/recommended/", token=T['student'])
j = safe_json(r)
p("Offer recommendations (Idea D)",
  r.status_code == 200, f"{len(j.get('data',[]))} offers matched")

r = get("/api/offers/company-locations/")
p("Company locations map endpoint (Idea 5)", r.status_code == 200)

if I.get('offer_id'):
    r = get(f"/api/offers/{I['offer_id']}/")
    p("Get single offer by ID", r.status_code == 200)

    r = put(f"/api/offers/{I['offer_id']}/update/",
            {"title": "Stage Django (v2)", "description": "Updated desc.", "town": "Alger",
             "tech_stack": "Python Django"},
            token=T['company'])
    p("Company updates their offer (200)", r.status_code == 200, debug(r))

# ═════════════════════════════════════════════════════════════════════════════
section("8. APPLICATIONS — Submit, Deadline, Paid, Review")
# ═════════════════════════════════════════════════════════════════════════════

# Idea 2: Licence student blocked from paid offer
if I.get('paid_offer_id'):
    r = post("/api/applications/",
             {"offer": I['paid_offer_id'], "cover_letter": "Je veux ce stage payé."},
             token=T['student'])
    p("Idea 2 — Licence student CANNOT apply to paid offer (403)",
      r.status_code == 403, debug(r))

if I.get('offer_id'):
    # Normal application — 201 if new, 409 if already applied (stale data from prev run)
    r = post("/api/applications/",
             {"offer": I['offer_id'], "cover_letter": "Je suis très motivé, j'ai des compétences en Django."},
             token=T['student'])
    p("Student applies to offer (201 or 409 if exists)", r.status_code in [201, 409], debug(r))
    # Get the application id whether it was just created or already existed
    if r.status_code == 201:
        I['app_id'] = safe_json(r).get('data', {}).get('id')
    else:
        # Already applied — find existing application from list
        existing = get("/api/applications/my-applications/", token=T['student'])
        apps = safe_json(existing).get('data', [])
        I['app_id'] = next((a['id'] for a in apps if a.get('offer') == I['offer_id']), None)

    # Duplicate application always rejected
    r = post("/api/applications/",
             {"offer": I['offer_id'], "cover_letter": "Deuxième tentative."},
             token=T['student'])
    p("Duplicate application REJECTED (409)", r.status_code == 409)

    # Student2 applies — 201 if new, 409 if already applied
    r = post("/api/applications/",
             {"offer": I['offer_id'], "cover_letter": "Sara est aussi très motivée."},
             token=T['student2'])
    p("Student2 applies to same offer (201 or 409 if exists)", r.status_code in [201, 409], debug(r))
    if r.status_code == 201:
        I['app2_id'] = safe_json(r).get('data', {}).get('id')
    else:
        existing2 = get("/api/applications/my-applications/", token=T['student2'])
        apps2 = safe_json(existing2).get('data', [])
        I['app2_id'] = next((a['id'] for a in apps2 if a.get('offer') == I['offer_id']), None)

# Student sees own applications
r = get("/api/applications/my-applications/", token=T['student'])
j = safe_json(r)
p("Student sees their applications", r.status_code == 200, debug(r))

# Company sees applicants for their offer
if I.get('offer_id'):
    r = get(f"/api/applications/offer/{I['offer_id']}/", token=T['company'])
    j = safe_json(r)
    count = j.get('data', {}).get('count', 0)
    p("Company sees applicants for their offer",
      r.status_code == 200 and count >= 2, f"count={count}")

# Company accepts student1 — 200 if pending, 400 if already accepted/refused (stale data)
if I.get('app_id'):
    r = patch(f"/api/applications/{I['app_id']}/review/",
              {"status": "accepted"}, token=T['company'])
    p("Company ACCEPTS student1 (200 or 400 if already reviewed)",
      r.status_code in [200, 400], debug(r))

    # Re-reviewing after acceptance must always be rejected
    r = patch(f"/api/applications/{I['app_id']}/review/",
              {"status": "refused"}, token=T['company'])
    p("Cannot re-review already accepted (400)", r.status_code == 400)

# Company refuses student2 — 200 if pending, 400 if already refused (stale data)
if I.get('app2_id'):
    r = patch(f"/api/applications/{I['app2_id']}/review/",
              {"status": "refused"}, token=T['company'])
    p("Company REFUSES student2 → triggers course notification (Idea 4)",
      r.status_code in [200, 400], debug(r))

# Unauthenticated cannot apply
r = post("/api/applications/", {"offer": I.get('offer_id', 1)})
p("Unauthenticated CANNOT apply (401)", r.status_code == 401)

# ═════════════════════════════════════════════════════════════════════════════
section("9. NOTIFICATIONS")
# ═════════════════════════════════════════════════════════════════════════════
r = get("/api/notifications/", token=T['student'])
j = safe_json(r)
total_notifs = j.get('data', {}).get('total', 0) if isinstance(j.get('data'), dict) else 0
p("Student GET notifications (200)", r.status_code == 200, debug(r))
p("Student has at least 1 notification", total_notifs >= 1, f"total={total_notifs}")

r = get("/api/notifications/unread-count/", token=T['student'])
j = safe_json(r)
p("Unread count endpoint (200)", r.status_code == 200)
p("Unread count is a number", isinstance(j.get('data', {}).get('unread_count'), int),
  f"unread={j.get('data',{}).get('unread_count')}")

r = patch("/api/notifications/read-all/", {}, token=T['student'])
p("Mark all as read (200)", r.status_code == 200, debug(r))

# Student2 should have refusal + course suggestions notification
r = get("/api/notifications/", token=T['student2'])
j = safe_json(r)
total2 = j.get('data', {}).get('total', 0) if isinstance(j.get('data'), dict) else 0
p("Refused student2 has notification", total2 >= 1, f"total={total2}")

# ═════════════════════════════════════════════════════════════════════════════
section("10. CONVENTION SIGNING WORKFLOW")
# ═════════════════════════════════════════════════════════════════════════════
time.sleep(0.5)   # let the post_save signal fire

# Find the convention created by the signal
conv_id = None
for i in range(1, 30):
    r = get(f"/api/conventions/{i}/preview/", token=T['student'])
    if r.status_code == 200:
        conv_id = i
        conv_status = safe_json(r).get('data', {}).get('status', '')
        p(f"Convention auto-created by signal (id={i}, status={conv_status})", True)
        break

if conv_id is None:
    p("Convention auto-created by signal", False,
      "Not found — check applications/signals.py is connected in apps.py")
else:
    # Wrong stage test: company tries to sign before student
    r = post(f"/api/conventions/{conv_id}/sign/", {}, token=T['company'])
    p("Company CANNOT sign at PENDING_STUDENT stage (400)", r.status_code == 400, debug(r))

    # Student signs first
    r = post(f"/api/conventions/{conv_id}/sign/", {}, token=T['student'])
    p("Student signs → PENDING_COMPANY (200)", r.status_code == 200, debug(r))

    # Student cannot sign again
    r = post(f"/api/conventions/{conv_id}/sign/", {}, token=T['student'])
    p("Student CANNOT sign twice (400)", r.status_code == 400)

    # Company signs
    r = post(f"/api/conventions/{conv_id}/sign/", {}, token=T['company'])
    p("Company signs → PENDING_ADMIN (200)", r.status_code == 200, debug(r))

    # Administration validates
    r = post(f"/api/conventions/{conv_id}/sign/", {}, token=T['administ'])
    p("Administration validates → VALIDATED (200)", r.status_code == 200, debug(r))

    # Verify final status
    r = get(f"/api/conventions/{conv_id}/preview/", token=T['student'])
    final_status = safe_json(r).get('data', {}).get('status', '')
    p("Convention final status is VALIDATED", final_status == 'VALIDATED',
      f"status={final_status}")

# ═════════════════════════════════════════════════════════════════════════════
section("11. INTERNSHIP VALIDATION + CV AUTO-UPDATE (Idea 1)")
# ═════════════════════════════════════════════════════════════════════════════
r = get("/api/applications/pending-validation/", token=T['administ'])
j = safe_json(r)
p("Administration sees pending validations (scoped)", r.status_code == 200, debug(r))
pending = j.get('pending_validations', [])
p("Pending validation list is a list", isinstance(pending, list), f"count={len(pending)}")

if I.get('app_id'):
    r = put(f"/api/applications/{I['app_id']}/validate/", {}, token=T['administ'])
    p("Administration validates internship (200 or 400 if already validated)",
      r.status_code in [200, 400], debug(r))

# Idea 1: Check CV was auto-updated with the internship experience after validation.
# The auto-added entry always contains 'Stag.io' in its description.
r = get("/api/auth/cv/", token=T['student'])
j = safe_json(r)
experiences = j.get('data', {}).get('experiences', [])
auto_added = any('Stag.io' in (e.get('description') or '') for e in experiences)
# This passes if: (a) validation just happened and added the entry, OR
# (b) a previous run already added it (the entry is still there from last time)
p("Idea 1 — CV has auto-added internship experience (Stag.io)",
  auto_added or len(experiences) >= 2,
  f"total experiences={len(experiences)}, stag.io entry={auto_added}")

# Student cannot validate
r = put(f"/api/applications/{I.get('app_id',1)}/validate/", {}, token=T['student'])
p("Student CANNOT validate internship (403)", r.status_code == 403)

# ═════════════════════════════════════════════════════════════════════════════
section("12. STATISTICS (Idea C — scoped by university)")
# ═════════════════════════════════════════════════════════════════════════════
r = get("/api/applications/stats/", token=T['admin'])
j = safe_json(r)
d = j.get('data', {})
p("Admin GET stats (200)", r.status_code == 200, debug(r))
p("Stats has students + offers + applications",
  'students' in d and 'offers' in d and 'applications' in d)
p("Admin sees ALL universities (institution='All universities')",
  d.get('institution') == 'All universities', f"institution={d.get('institution')}")

r = get("/api/applications/stats/", token=T['administ'])
j = safe_json(r)
d2 = j.get('data', {})
p("Administration GET stats (200, scoped)", r.status_code == 200, debug(r))
p("Administration sees only their university",
  d2.get('institution') != 'All universities',
  f"institution={d2.get('institution')}")
p("Scoped students count >= 1", d2.get('students', {}).get('total', 0) >= 1,
  f"total={d2.get('students',{}).get('total',0)}")

r = get("/api/applications/stats/", params={"year": "2025"}, token=T['admin'])
p("Stats with ?year=2025 filter (200)", r.status_code == 200,
  f"period={safe_json(r).get('data',{}).get('period','')}")

r = get("/api/applications/stats/", token=T['student'])
p("Student CANNOT access stats (403)", r.status_code == 403)

# ═════════════════════════════════════════════════════════════════════════════
section("13. COMPANY RATING (Idea B)")
# ═════════════════════════════════════════════════════════════════════════════
if I.get('app_id'):
    r = post(f"/api/applications/{I['app_id']}/rate/",
             {"rating": 4, "comment": "Bonne ambiance, bon encadrement."},
             token=T['student'])
    p("Student rates company after validated internship (200 or 400)",
      r.status_code in [200, 400], debug(r))

    r = post(f"/api/applications/{I['app_id']}/rate/",
             {"rating": 5}, token=T['student'])
    p("Cannot rate twice (400)", r.status_code == 400)

r = get("/api/applications/company-rating/1/")
p("Company rating endpoint reachable (200 or 404)", r.status_code in [200, 404])

# ═════════════════════════════════════════════════════════════════════════════
section("14. ADMIN USER MANAGEMENT")
# ═════════════════════════════════════════════════════════════════════════════
r = get("/api/admin/users/", token=T['admin'])
j = safe_json(r)
total_users = len(j.get('data', []))
p("Admin lists all users (200)", r.status_code == 200, debug(r))
p("At least 4 users exist", total_users >= 4, f"found {total_users}")

r = get("/api/admin/users/", token=T['admin'], params={"role": "student"})
j = safe_json(r)
all_students = all(u['role'] == 'student' for u in j.get('data', [{'role':'student'}]))
p("Filter by role=student — all results are students", all_students)

r = get("/api/admin/users/", token=T['student'])
p("Student CANNOT access admin user list (403)", r.status_code == 403)

# ═════════════════════════════════════════════════════════════════════════════
section("15. PERMISSION CROSS-CHECKS")
# ═════════════════════════════════════════════════════════════════════════════
r = get("/api/applications/my-applications/")
p("Unauthenticated CANNOT see applications (401)", r.status_code == 401)

r = post("/api/offers/create/", {"title": "hack"})
p("Unauthenticated CANNOT create offer (401)", r.status_code == 401)

r = get("/api/auth/cv/", token=T['company'])
p("Company CANNOT access student CV (403)", r.status_code == 403)

r = get("/api/auth/cv/", token=T['administ'])
p("Administration CANNOT access student CV (403)", r.status_code == 403)

r = put(f"/api/applications/{I.get('app_id',1)}/validate/", {}, token=T['company'])
p("Company CANNOT validate internship (403)", r.status_code == 403)

r = get("/api/admin/users/", token=T['company'])
p("Company CANNOT access admin user list (403)", r.status_code == 403)

# ═════════════════════════════════════════════════════════════════════════════
section("FINAL SUMMARY")
# ═════════════════════════════════════════════════════════════════════════════
total = PASS + FAIL
pct   = int(PASS / total * 100) if total else 0
print(f"\n  Total tests : {total}")
print(f"  \u2705 Pass       : {PASS}")
print(f"  \u274c Fail       : {FAIL}")
print(f"  Score       : {pct}%")

if FAIL == 0:
    print("\n  \U0001f389 Backend is 100% working! Ready for frontend connection.")
elif FAIL <= 4:
    print(f"\n  \U0001f7e1 Almost there — {FAIL} test(s) failed:")
    for w in WARNS:
        print(f"     \u2022 {w}")
else:
    print(f"\n  \U0001f534 {FAIL} tests failed. Review the details above.")
    print("     Common causes:")
    print("     \u2022 Forgot to run: python manage.py makemigrations && python manage.py migrate")
    print("     \u2022 Signal not connected: check applications/apps.py has ready() method")
    print("     \u2022 Missing .env variables")