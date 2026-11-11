# ================================================================
# FILE: backend/seed.py
# Initialise the Cerea database: create tables, an admin account
# and (optionally) demo data.
#
#   python seed.py                 # tables + admin
#   python seed.py --demo          # + demo departments, users, cards, announcements
#   python seed.py --reset-admin   # set a new admin password
#
# Admin credentials come from ADMIN_NIK / ADMIN_PASSWORD in .env.
# If ADMIN_PASSWORD is empty, a random password is generated and
# printed once. Demo users get DEMO_USER_PASSWORD (or a random one).
# Safe to re-run: existing rows are left untouched.
# ================================================================

import argparse
import os
import secrets
from datetime import datetime, timedelta

from dotenv import load_dotenv

load_dotenv()

import auth  # noqa: E402  (needs .env loaded)
import models  # noqa: E402
from database import SessionLocal, engine  # noqa: E402

ALL_ROLES = list(models.VALID_ROLES)

DEMO_DEPARTMENTS = [
    ("Information Technology", True), ("Human Resources", True), ("Finance", True),
    ("Operations", True), ("Marketing", True), ("Procurement", True), ("Legal", False),
]

DEMO_USERS = [  # nik, name, role, department
    ("1001", "Budi Santoso", "CEO", "Operations"),
    ("1002", "Sari Wijaya", "CFO", "Finance"),
    ("1003", "Dewi Lestari", "DCFO", "Finance"),
    ("1004", "Andi Pratama", "GM/DGM", "Operations"),
    ("1005", "Rina Kusuma", "GM/DGM", "Human Resources"),
    ("2001", "Agus Setiawan", "User", "Information Technology"),
    ("2002", "Maya Putri", "User", "Human Resources"),
    ("2003", "Rudi Hartono", "User", "Finance"),
    ("2004", "Lina Marlina", "User", "Operations"),
    ("2005", "Dimas Prakoso", "User", "Marketing"),
    ("2006", "Fitri Handayani", "User", "Procurement"),
]

# name, detail, link, category, roles, departments, is_general, icon
DEMO_CARDS = [
    ("Company Website", "Official company website", "https://example.com", "Website", ALL_ROLES, [], True, "globe"),
    ("Webmail", "Corporate email access", "https://example.com/mail", "Application", ALL_ROLES, [], True, "send"),
    ("Employee Handbook", "Policies and guidelines", "https://example.com/handbook", "Form", ALL_ROLES, [], True, "bookOpen"),
    ("IT Helpdesk", "Report IT issues and track tickets", "https://example.com/helpdesk", "Application", ALL_ROLES, [], True, "helpCircle"),
    ("HRMS", "Human resource management", "https://example.com/hrms", "Application", ALL_ROLES, ["Human Resources"], False, "users"),
    ("Payroll Portal", "Payslips and payroll reports", "https://example.com/payroll", "Application", ["Admin", "CFO", "DCFO"], ["Finance"], False, "wallet"),
    ("Finance Dashboard", "Budget and cash flow overview", "https://example.com/finance", "Dashboard", ["Admin", "CEO", "CFO", "DCFO"], [], False, "barChart2"),
    ("Operations Dashboard", "Daily operations performance", "https://example.com/operations", "Dashboard", ["Admin", "CEO", "GM/DGM"], [], False, "gauge"),
    ("Network Monitoring", "Server and network status", "https://example.com/network", "Dashboard", ["Admin"], ["Information Technology"], False, "wifi"),
    ("Leave Request Form", "Submit leave and time-off requests", "https://example.com/leave", "Form", ALL_ROLES, [], False, "calendar"),
    ("Purchase Request", "Request goods and services", "https://example.com/purchase", "Form", ["Admin", "GM/DGM", "User"], ["Procurement", "Operations"], False, "shoppingCart"),
    ("Campaign Tracker", "Marketing campaign progress", "https://example.com/campaigns", "Application", ["Admin", "GM/DGM", "User"], ["Marketing"], False, "pieChart"),
]

# activity, description, link, label, priority, roles, departments, days_ago
DEMO_ANNOUNCEMENTS = [
    ("Scheduled system maintenance", "The portal will be unavailable on Saturday 22:00-24:00 for maintenance.",
     "https://example.com/maintenance", "Details", "high", [], [], 0),
    ("Welcome to the new Cerea portal", "Our employee portal has a new look. Explore the apps available to you.",
     None, None, "medium", [], [], 1),
    ("Year-end budget submission", "Department heads: please submit your budget plan by the end of the month.",
     "https://example.com/budget", "Submit plan", "high", ["CFO", "DCFO", "GM/DGM"], ["Finance", "Operations"], 2),
    ("Open enrollment for health benefits", "Review and update your health benefit choices before the deadline.",
     "https://example.com/benefits", "Learn more", "medium", [], ["Human Resources"], 3),
    ("Security awareness training", "Complete the mandatory 20-minute phishing awareness course this month.",
     "https://example.com/training", "Start course", "medium", [], [], 5),
    ("Office closed on public holiday", "Offices will be closed on the upcoming public holiday. Plan your work accordingly.",
     None, None, "low", [], [], 7),
    ("Marketing campaign kickoff", "The campaign kickoff meeting is open to all Marketing team members.",
     None, None, "low", [], ["Marketing"], 9),
]


def ensure_admin(db, reset=False):
    nik = os.getenv("ADMIN_NIK", "admin")
    password = os.getenv("ADMIN_PASSWORD") or secrets.token_urlsafe(12)
    generated = not os.getenv("ADMIN_PASSWORD")

    user = db.query(models.User).filter(models.User.nik == nik).first()
    if user and not reset:
        print(f"- Admin '{nik}' already exists (use --reset-admin to set a new password)")
        return
    if user:
        user.password = auth.hash_password(password)
    else:
        db.add(models.User(nik=nik, full_name="Administrator", role="Admin",
                           password=auth.hash_password(password)))
    db.commit()
    print(f"- Admin '{nik}' {'password reset' if user else 'created'}")
    if generated:
        print(f"  Generated password (shown once): {password}")


def seed_demo(db):
    depts = {}
    for name, active in DEMO_DEPARTMENTS:
        d = db.query(models.Department).filter(models.Department.department_name == name).first()
        if not d:
            d = models.Department(department_name=name, is_active=active)
            db.add(d)
            db.flush()
        depts[name] = d.id

    demo_pw = os.getenv("DEMO_USER_PASSWORD") or secrets.token_urlsafe(9)
    created_users = 0
    for nik, name, role, dept in DEMO_USERS:
        if not db.query(models.User).filter(models.User.nik == nik).first():
            db.add(models.User(nik=nik, full_name=name, role=role, department=dept,
                               department_id=depts[dept], password=auth.hash_password(demo_pw)))
            created_users += 1

    if db.query(models.ApplicationCard).count() == 0:
        for i, (name, detail, link, cat, roles, dnames, general, icon) in enumerate(DEMO_CARDS, 1):
            db.add(models.ApplicationCard(
                page_name=name, page_detail=detail, link_url=link, category=cat,
                target_roles=roles, target_department=[depts[d] for d in dnames],
                is_general=general, icon_type="preset", icon_value=icon, icon_name=icon,
                sort_order=i,
            ))

    if db.query(models.Announcement).count() == 0:
        now = datetime.now()
        for act, desc, link, label, prio, roles, dnames, days in DEMO_ANNOUNCEMENTS:
            db.add(models.Announcement(
                activity=act, description=desc, link_url=link, link_label=label, priority=prio,
                target_roles=roles, target_departments=[depts[d] for d in dnames],
                is_active=True, announce_date=now - timedelta(days=days),
            ))

    db.commit()
    print(f"- Demo data ready ({created_users} new demo users)")
    if created_users and not os.getenv("DEMO_USER_PASSWORD"):
        print(f"  Demo user password (shown once): {demo_pw}")


def main():
    parser = argparse.ArgumentParser(description="Initialise the Cerea database")
    parser.add_argument("--demo", action="store_true", help="add demo departments, users, cards and announcements")
    parser.add_argument("--reset-admin", action="store_true", help="set a new password for the admin account")
    args = parser.parse_args()

    models.Base.metadata.create_all(bind=engine)
    print("- Tables ready")
    db = SessionLocal()
    try:
        ensure_admin(db, reset=args.reset_admin)
        if args.demo:
            seed_demo(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
