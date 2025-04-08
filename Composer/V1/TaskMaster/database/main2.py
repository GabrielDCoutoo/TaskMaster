from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import create_engine, Column, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import psycopg2
from psycopg2 import sql
import uvicorn

# ==============================================
# DATABASE SETUP
# ==============================================

DB_CONFIG = {
    "user": "postgres",
    "password": "rafa",  # Replace if needed
    "host": "localhost",
    "port": "5432",
    "name": "current_user"
}

def create_database():
    """Create the database if it doesn't exist"""
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"]
        )
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_CONFIG["name"],))
        exists = cursor.fetchone()

        if not exists:
            cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(DB_CONFIG["name"])))
            print(f"Database {DB_CONFIG['name']} created successfully")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error creating database: {e}")
        raise

# Create database
create_database()

# SQLAlchemy setup
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['name']}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# ==============================================
# MODEL
# ==============================================

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)

# Create tables
Base.metadata.create_all(bind=engine)

# ==============================================
# FASTAPI APP
# ==============================================

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==============================================
# ENDPOINTS
# ==============================================

@app.post("/users/", status_code=status.HTTP_201_CREATED)
def create_user(user_id: int, db: Session = Depends(get_db)):
    """Create a new user with user_id"""
    if db.query(User).filter(User.user_id == user_id).first():
        raise HTTPException(status_code=400, detail="User ID already exists")
    
    user = User(user_id=user_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created", "user_id": user.user_id}

@app.get("/users/", status_code=status.HTTP_200_OK)
def list_users(db: Session = Depends(get_db)):
    """List all users"""
    users = db.query(User).all()
    return [{"user_id": user.user_id} for user in users]

# ==============================================
# MAIN ENTRY POINT
# ==============================================

if __name__ == "__main__":
    uvicorn.run("main2:app", host="192.168.40.47", port=8002, reload=True)
