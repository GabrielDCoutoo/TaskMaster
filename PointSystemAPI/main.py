from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy import exc, desc, func
from sqlalchemy.future import select
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from pydantic import BaseModel, EmailStr
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
    email: EmailStr

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
@app.post("/v1/users/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(name=user.name, email=user.email, total_points=0)
    db.add(db_user)
    db.commit()
    return {"message": "User created successfully"}

# Atualiza um utilizador
@app.patch("/v1/users/{user_id}/")
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.name = user.name
    db_user.email = user.email

    db.commit()

    return {"message": "User updated successfully"}


# Remove um utilizador à escolha com base no ID de utilizador
@app.delete("/v1/users/{user_id}")
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

# Retorna todos os utilizadores presentes na base de dados em formato de rank, atualizado após recomendação do professor de não usar um get á parte para o ranking e juntar tudo no get_users
@app.get("/v1/users/")
def get_users(db: Session = Depends(get_db)):
    # Executa a query de forma sincrona, de forma assincrona dá erro devido a algum factor do sqlalchemy: TypeError: object ChunkedIteratorResult can't be used in 'await' expression
    result = db.execute(
        select(
            User.id,
            User.name,
            User.total_points,
            User.email
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
        {"rank": i + 1, "user_id": user[0], "name": user[1], "Email": user[3], "total_points": user[2]}
        for i, user in enumerate(users)
    ]

    return {"ranking": ranking}

# Adiciona pontos ao utilizador
@app.post("/v1/users/{user_id}/points/")
def add_points(user_id: int, points: int, message: str, db: Session = Depends(get_db)):
    if points <= 0:
        raise HTTPException(status_code=400, detail="Pontos a atribuir têm que ter um valor positivo")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_point = Point(user_id=user_id, points_change=points, message=message)
    db.add(new_point)
    user.total_points += points
    db.commit()
    
    return {"message": "Points added successfully", "total_points": user.total_points}


# Remove pontos do utilizador
@app.delete("/v1/users/{user_id}/points/")
def remove_points(user_id: int, points: int, message: str, db: Session = Depends(get_db)):
    if points <= 0:
        raise HTTPException(status_code=400, detail="Pontos a remover têm que ter um valor positivo")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_point = Point(user_id=user_id, points_change=-abs(points), message=message)
    db.add(new_point)
    user.total_points = max(0, user.total_points - abs(points))
    db.commit()
    
    return {"message": "Points removed successfully", "total_points": user.total_points}

# Histórico de pontos de um utilizador, onde se sabe quantos pontos recebou ou lhe foram retirados e em que dia.
@app.get("/v1/points/history/{user_id}")
def get_user_points_history(
    user_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),  # Quantos valores queremos passar a frente, ou seja se o skip for 10 e tivermos 100 resultados. Aparecem do resultado 10 ao 100 (dá skip ao 1 a 10)
    limit: int = Query(10, ge=1, le=100)  # Quantidade de resultados por página
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Obter todos os resultados antes da paginação
        total_results = db.query(Point).filter(Point.user_id == user_id).count()

        # Fetch paginated history
        history = (
            db.query(Point)
            .filter(Point.user_id == user_id)
            .order_by(desc(Point.change_date))
            .offset(skip)
            .limit(limit)
            .all()
        )

        history_data = [
            {"points_change": p.points_change, "change_date": p.change_date.isoformat(), "message": p.message} 
            for p in history
        ]

        return {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "total_points": user.total_points,
            "total_results": total_results,
            "history": history_data,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "remaining": max(0, total_results - (skip + limit))
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")