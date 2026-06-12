# This file defines the API routes for document processing and question answering in the AI service.
from fastapi import APIRouter, HTTPException, BackgroundTasks # background tasks makes it so user doesnt have to wait
from pydantic import BaseModel
import os
from services.document_processor import process_document
from services.rag import answer_question

router = APIRouter()

class ProcessRequest(BaseModel):
    document_id: str
    file_path: str
    collection_id: str
    user_id: str

class QuestionRequest(BaseModel):
    query: str
    collection_id: str
    user_id: str

@router.post("/process")
async def process_doc(request: ProcessRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        process_document,
        request.document_id,
        request.file_path,
        request.collection_id,
        request.user_id
    )
    return {"message": "Document processing started in the background", "document_id": request.document_id}

@router.post("/ask")
async def ask_question(request: QuestionRequest):
    try: 
        result = answer_question(request.query, request.collection_id, request.user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))