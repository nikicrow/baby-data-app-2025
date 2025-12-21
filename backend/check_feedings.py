"""
Quick script to check feeding sessions in the database.
Run this from the backend directory with your virtual environment activated.
"""

import sys
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.models.feeding import FeedingSession
from app.core.config import settings

def main():
    # Create database connection
    engine = create_engine(str(settings.DATABASE_URL))

    with Session(engine) as session:
        # Query the 10 most recent feeding sessions
        stmt = select(FeedingSession).order_by(FeedingSession.created_at.desc()).limit(10)
        feedings = session.scalars(stmt).all()

        if not feedings:
            print("No feeding sessions found in database.")
            return

        print(f"\n{'='*100}")
        print(f"Found {len(feedings)} recent feeding sessions:")
        print(f"{'='*100}\n")

        for i, feeding in enumerate(feedings, 1):
            print(f"[{i}] Feeding Session")
            print(f"    ID: {feeding.id}")
            print(f"    Type: {feeding.feeding_type.value}")
            print(f"    Start Time: {feeding.start_time}")

            if feeding.feeding_type.value == 'breast':
                print(f"    Breast Started: {feeding.breast_started.value if feeding.breast_started else 'N/A'}")
                print(f"    Left Breast Duration: {feeding.left_breast_duration} min" if feeding.left_breast_duration else "    Left Breast: Not used")
                print(f"    Right Breast Duration: {feeding.right_breast_duration} min" if feeding.right_breast_duration else "    Right Breast: Not used")

                total = (feeding.left_breast_duration or 0) + (feeding.right_breast_duration or 0)
                print(f"    Total Duration: {total} min")

            elif feeding.feeding_type.value == 'bottle':
                print(f"    Volume Offered: {feeding.volume_offered_ml} ml")
                print(f"    Volume Consumed: {feeding.volume_consumed_ml} ml")

            if feeding.notes:
                print(f"    Notes: {feeding.notes}")

            print(f"    Created: {feeding.created_at}")
            print()

if __name__ == "__main__":
    main()
