# services/rag.py -- Retrieval-Augmented Generation (RAG) service for answering questions based on document context
import os
from openai import OpenAI
from services.database import get_connection
from services.document_processor import generate_embedding

client = OpenAI(api_key = os.getenv("OPENAI_API_KEY"))

def search_similar_chunks(query: str, collection_id: str, user_id: str, limit: int = 5) -> list[dict]:
    query_embedding = generate_embedding(query)

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """ SELECT content, document_id,
            1 - (embedding <=> %s::vector) AS similarity
            FROM document_chunks
            WHERE collection_id = %s AND user_id = %s
            ORDER BY embedding <=> %s::vector
            LIMIT %s""",
            (query_embedding, collection_id, user_id, query_embedding, limit )
        )

        rows = cur.fetchall()
        return [
            {
                "content": row[0],
                "document_id": row[1],
                "similarity": row[2]
            }

            for row in rows
        ]
    
    finally:
        cur.close()
        conn.close() # ensure we close the connection

def generate_answer(query: str, chunks: list[dict]) -> str:
    context = "\n\n".join([chunk["content"] for chunk in chunks])
    response = client.chat.completions.create(
        model = "gpt-4o-mini",
        messages = [
            {
                "role": "system",
                "content": """You are a helpful assistant that answers questions based on the provided document context.
                Always base your answers on the context provided.
                If the answer cannot be found in the context, say so clearly.
                Be concise and accurate."""
            },
            {
                "role": "user",
                "content": f"""Context from documents:
        {context}

        Question: {query}

        Please answer the question based on the context above."""
                    }
                ],
                max_tokens=500
    )

    return response.choices[0].message.content

def answer_question(query: str, collection_id: str, user_id:str) -> dict:
    chunks = search_similar_chunks(query, collection_id, user_id)

    if not chunks:
        return{
            "answer": "No relevant information found in the documents.",
            "source_chunks": []
        }
    
    answer = generate_answer(query, chunks)

    return {
        "answer": answer, 
        "sources": [
            {
                "document_id": chunk["document_id"],
                "content": chunk["content"][:200] + "...", # include a snippet of the source content
                "similarity": chunk["similarity"]
            }
            for chunk in chunks
        ]
    }