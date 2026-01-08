"""
Seed data untuk kelas dengan struktur internasional sesuai permintaan:

- SD: Grades 1–6, masing-masing 2 kelas (A, B) → total 12 kelas
- SMP: Grades 7–9, masing-masing 3 kelas (A, B, C) → total 9 kelas
- SMA: 3 kelas bergaya Cambridge (special international cohorts)
- SMK: 3 kelas bergaya teknikal internasional

⚠️ Script ini akan MENGHAPUS data kelas yang ada lalu membuat ulang.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.kelas import Kelas


def seed_kelas():
    db = SessionLocal()

    try:
        print("🔥 Clearing existing kelas data...")
        deleted = db.query(Kelas).delete()
        db.commit()
        print(f"🗑️  Deleted {deleted} existing records")

        kelas_data = []

        # SD: Grades 1..6, A and B
        for grade in range(1, 7):
            for section in ("A", "B"):
                code = f"SD-G{grade}-{section}"
                name = f"Grade {grade} – International {grade}{section}"
                description = (
                    f"Primary grade {grade} international classroom ({section}) — Cambridge-influenced curriculum"
                )
                capacity = 24 if grade <= 2 else 26 if grade <= 4 else 28
                kelas_data.append(
                    {
                        "code": code,
                        "name": name,
                        "description": description,
                        "capacity": capacity,
                        "academic_year": "2024/2025",
                        "semester": None,
                        "is_active": True,
                    }
                )

        # SMP: Grades 7..9, A, B, C
        for grade in range(7, 10):
            for section in ("A", "B", "C"):
                code = f"SMP-G{grade}-{section}"
                name = f"Grade {grade} – Junior International {grade}{section}"
                description = (
                    f"Lower secondary grade {grade} class ({section}) with stronger academic pathway and leadership programs"
                )
                capacity = 30
                kelas_data.append(
                    {
                        "code": code,
                        "name": name,
                        "description": description,
                        "capacity": capacity,
                        "academic_year": "2024/2025",
                        "semester": None,
                        "is_active": True,
                    }
                )

        # SMA: 3 Cambridge-style international cohorts
        sma_variants = [
            (
                "SMA-CAM-IGCSE-SCI",
                "IGCSE – Science Stream",
                "Cambridge IGCSE cohort focusing on Mathematics, Physics, Chemistry, and Biology"
            ),
            (
                "SMA-CAM-AS-HUM",
                "AS Level – Humanities Stream",
                "Cambridge AS Level cohort focusing on Economics, Sociology, and Global Perspectives"
            ),
            (
                "SMA-CAM-ALEVEL-DIP",
                "A Level – International Diploma",
                "Cambridge A Level capstone cohort preparing for top global universities"
            )
        ]


        for code, name, desc in sma_variants:
            kelas_data.append(
                {
                    "code": code,
                    "name": name,
                    "description": desc,
                    "capacity": 22,
                    "academic_year": "2024/2025",
                    "semester": None,
                    "is_active": True,
                }
            )

        # SMK: 3 technical international vocational cohorts
        smk_variants = [
            ("SMK-G10-TEK", "Grade 10 – Technical Campus A", "International technical campus: software engineering fundamentals"),
            ("SMK-G11-TEK", "Grade 11 – Technical Campus B", "International technical campus: AI & robotics specialization"),
            ("SMK-G12-TEK", "Grade 12 – Technical Campus C", "International technical campus: industry-ready practicum and entrepreneurship")
        ]

        for code, name, desc in smk_variants:
            kelas_data.append(
                {
                    "code": code,
                    "name": name,
                    "description": desc,
                    "capacity": 28,
                    "academic_year": "2024/2025",
                    "semester": None,
                    "is_active": True,
                }
            )

        # Persist
        for data in kelas_data:
            db.add(Kelas(**data))

        db.commit()

        print(f"✅ Successfully created {len(kelas_data)} kelas records!")

        print("\n📋 Final Kelas List:")
        for k in db.query(Kelas).order_by(Kelas.code).all():
            print(f" - {k.code} | {k.name} | Cap: {k.capacity}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 75)
    print("🌍 FAHRENCENTER INTERNATIONAL SCHOOL – KELAS SEEDER (UPDATED)")
    print("=" * 75)
    seed_kelas()
    print("\n✨ Seeding completed successfully.")
