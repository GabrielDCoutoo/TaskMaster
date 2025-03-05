from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    total_points = Column(Integer, default=0, nullable=False)

    # Relação que relaciona com o historial de pontos
    points_history = relationship("Point", back_populates="user", cascade="all, delete-orphan")

class Point(Base):
    __tablename__ = 'points'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    points_change = Column(Integer, nullable=False)
    change_date = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    message = Column(String, nullable=True)

    # Relação que relaciona com o utilizador
    user = relationship("User", back_populates="points_history")
