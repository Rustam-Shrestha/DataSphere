import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://compliance:compliance@localhost:5432/compliance_db")
PORT = int(os.getenv("PORT", "8000"))
