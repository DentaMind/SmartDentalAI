from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    to = Column(String, nullable=False)
    cc = Column(String, nullable=True)
    bcc = Column(String, nullable=True)
    subject = Column(String, nullable=False)
    body = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    is_read = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)
    category = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    attachments = Column(JSON, nullable=True)

class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(String, nullable=False)
    variables = Column(JSON, nullable=True) 