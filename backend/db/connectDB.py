# connectDB.py
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import certifi


# Load environment variables from .env file
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.env"))
load_dotenv(dotenv_path)

# Get MongoDB URI from environment
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "Main"

if not MONGO_URI:
    raise ValueError("MONGO_URI is required but not found in .env file")

# Create global Mongo client with SSL certificate verification and connection pooling
client = AsyncIOMotorClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    maxPoolSize=50,
    minPoolSize=10,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000,
    socketTimeoutMS=10000,
)

# Access specific database
db = client[DB_NAME]

# Note: MongoDB connection initialized with connection pooling
# Database: {DB_NAME}, Pool size: 10-50 connections

