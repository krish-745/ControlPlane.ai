import asyncio
from sqlalchemy import text
from proxy.database import AsyncSessionLocal

async def wipe_db():
    print("Wiping interactions and flags from the database...")
    async with AsyncSessionLocal() as session:
        try:
            # We use TRUNCATE with CASCADE to quickly wipe both flags and interactions 
            # while leaving the policy_configs intact.
            await session.execute(text("TRUNCATE TABLE interactions CASCADE;"))
            await session.commit()
            print("Successfully wiped all interactions and flags! Dashboard is now clean.")
        except Exception as e:
            await session.rollback()
            print(f"Error wiping database: {e}")

if __name__ == "__main__":
    asyncio.run(wipe_db())
