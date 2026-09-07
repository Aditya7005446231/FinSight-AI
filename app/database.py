import os
from motor.motor_asyncio import AsyncIOMotorClient
form decouple import config

MONGODB_URL = config('MONGODB_URL')

