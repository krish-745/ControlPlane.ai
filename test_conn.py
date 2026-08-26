import asyncio, os
from dotenv import load_dotenv
load_dotenv()

# Test DB
db_url = os.getenv('DATABASE_URL')
if db_url:
    db_url = db_url.strip("\"'")
    if db_url.startswith('postgres://'): db_url = db_url.replace('postgres://', 'postgresql+asyncpg://', 1)
    elif db_url.startswith('postgresql://'): db_url = db_url.replace('postgresql://', 'postgresql+asyncpg://', 1)
    print(f'DB URL: {db_url}')
else:
    print('DATABASE_URL not found')

from sqlalchemy.ext.asyncio import create_async_engine
engine = create_async_engine(db_url, connect_args={'ssl': 'require'})

# Test Redis
redis_url = os.getenv('REDIS_URL_OVERRIDE')
if redis_url:
    redis_url = redis_url.strip("\"'")
import redis.asyncio as aioredis

async def test():
    print('Testing Postgres...')
    try:
        async with engine.begin() as conn:
            print('Postgres Connected!')
    except Exception as e:
        print(f'Postgres Error: {type(e).__name__} - {str(e)}')
    
    print('Testing Redis...')
    try:
        if redis_url:
            r = aioredis.from_url(redis_url, encoding='utf-8', decode_responses=True)
            await r.ping()
            print('Redis Connected!')
        else:
            print('REDIS_URL_OVERRIDE not found')
    except Exception as e:
        print(f'Redis Error: {type(e).__name__} - {str(e)}')

asyncio.run(test())
