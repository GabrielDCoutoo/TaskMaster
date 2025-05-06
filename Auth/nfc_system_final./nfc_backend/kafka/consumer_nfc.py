
from kafka import KafkaConsumer
import json
import sys
import os



# Adiciona o path correto à pasta que tem o models.py com NFCTag
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from database.database import SessionLocal
from database.models import NFCTag


from sqlalchemy.orm import Session


consumer = KafkaConsumer(
    'nfc_topic',
    bootstrap_servers='localhost:9092',
    auto_offset_reset='earliest',
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    group_id='nfc_group'
)

print("🛰️ A ouvir o tópico 'nfc_topic'...")
def save_tag_to_db(tag_data):
    db: Session = SessionLocal()
    tag_id = str(tag_data["tag_id"])  # <-- cast para string aqui

    tag_exists = db.query(NFCTag).filter_by(tag_id=tag_id).first()
    if not tag_exists:
        tag = NFCTag(
            tag_id=tag_id,
            user_name=tag_data.get("user_name", "Desconhecido"),
            user_email=tag_data.get("user_email", "Desconhecido")
        )
        db.add(tag)
        db.commit()
        print(f"✅ Tag guardada: {tag.tag_id}")
    else:
        print(f"⚠️ Tag já existente: {tag_id}")
    db.close()


for message in consumer:
    tag_data = message.value
    print(f"📥 Tag recebida: {tag_data}")
    save_tag_to_db(tag_data)
