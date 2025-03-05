from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import exc, desc, func
from sqlalchemy.future import select
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from pydantic import BaseModel
from typing import List
import models
from models import User, Point
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

app = FastAPI()

# Dependência para obter sessão da Base de Dados.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Modelos da API
class UserCreate(BaseModel):
    name: str
    email: str

class PointCreate(BaseModel):
    user_id: int
    points_change: int
    message: str

class PointHistoryResponse(BaseModel):
    points_change: int
    change_date: str

class UserPointsResponse(BaseModel):
    user_id: int
    name: str
    email: str
    total_points: int
    history: List[PointHistoryResponse]

models.Base.metadata.create_all(bind=engine)

# Redireciona a root da API para os docs para ser mais fácil aceder aos endpoints
@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")

# Cria um utilizador
@app.post("/users/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(name=user.name, email=user.email, total_points=0)
    db.add(db_user)
    db.commit()
    return {"message": "User created successfully"}

# Remove um utilizador à escolha com base no ID de utilizador
@app.delete("/users/{user_id}")
def remove_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        db.delete(db_user)
        db.commit()
        return {"message": "User removed successfully"}
    except exc.SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while removing the user")

# Retorna todos os utilizadores presentes na base de dados
@app.get("/users/")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {"users": users}

# Adiciona pontos ao utilizador
@app.post("/points/add/")
def add_points(point_data: PointCreate, db: Session = Depends(get_db)):

    if point_data.points_change <= 0:
        raise HTTPException(status_code=400, detail="Pontos a atribuir têm que ter um valor positivo")

    user = db.query(User).filter(User.id == point_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_point = Point(user_id=point_data.user_id, points_change=point_data.points_change, message=point_data.message)
    db.add(new_point)
    user.total_points += point_data.points_change
    db.commit()
    return {"message": "Points added successfully", "total_points": user.total_points}

# Remove pontos do utilizador
@app.post("/points/remove/")
def remove_points(point_data: PointCreate, db: Session = Depends(get_db)):

    if point_data.points_change <= 0:
        raise HTTPException(status_code=400, detail="Pontos a remover têm que ter um valor positivo")
    
    user = db.query(User).filter(User.id == point_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_point = Point(user_id=point_data.user_id, points_change=-abs(point_data.points_change), message=point_data.message)
    db.add(new_point)
    user.total_points = max(0, user.total_points - abs(point_data.points_change))
    db.commit()
    return {"message": "Points removed successfully", "total_points": user.total_points}

# Histórico de pontos de um utilizador, onde se sabe quantos pontos recebou ou lhe foram retirados e em que dia.
@app.get("/points/history/{user_id}")
def get_user_points_history(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Obtem o historial de pontos do utilizador, ordenados do mais recente ao menos recente
        history = db.query(Point).filter(Point.user_id == user_id).order_by(desc(Point.change_date)).all()

        # Formata a changedate numa string usando isoformat
        history_data = [
            {"points_change": p.points_change, "change_date": p.change_date.isoformat(), "message": p.message} for p in history
        ]

        # Retorna a resposta como um dicionário.
        return {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "total_points": user.total_points,
            "history": history_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
    
# Obter o rank dos utilizadores por pontos, do utilizador com mais a menos pontos
@app.get("/users/ranking/")
def get_users_ranking(db: Session = Depends(get_db)):
    # Executa a query de forma sincrona, de forma assincrona dá erro devido a algum factor do sqlalchemy: TypeError: object ChunkedIteratorResult can't be used in 'await' expression
    result = db.execute(
        select(
            User.id,
            User.name,
            User.total_points
        )
        .join(Point, User.id == Point.user_id, isouter=True) 
        .group_by(User.id, User.name)  
        .order_by(desc("total_points"))
    )
    users = result.fetchall()

    if not users:
        return {"ranking": []}

    # Formata a resposta do Ranking
    ranking = [
        {"rank": i + 1, "user_id": user[0], "name": user[1], "total_points": user[2]}
        for i, user in enumerate(users)
    ]

    return {"ranking": ranking}
