from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)
import os
print("OpenAI key loaded:", os.getenv("OPENAI_API_KEY")[:20] if os.getenv("OPENAI_API_KEY") else "NOT FOUND")
from openai import OpenAI
from pypdf import PdfReader
import boto3
import tempfile
from services.database import get_connection

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
s3_client = boto3.client('s3', region_name=os.getenv("AWS_REGION", "us-east-2"))

def download_from_s3(s3_bucket: str, s3_key: str) -> str:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    s3_client.download_file(s3_bucket, s3_key, tmp.name)
    tmp.close()
    return tmp.name

def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

def generate_embedding(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def process_document(document_id: str, s3_key: str, s3_bucket: str, collection_id: str, user_id: str):
    conn = get_connection()
    cur = conn.cursor()
    tmp_path = None

    try:
        cur.execute(
            "UPDATE documents SET processing_status = 'processing' WHERE id = %s",
            (document_id,)
        )
        conn.commit()

        print(f"Downloading from S3: {s3_bucket}/{s3_key}")
        tmp_path = download_from_s3(s3_bucket, s3_key)
        print(f"Downloaded to temp file: {tmp_path}")

        text = extract_text_from_pdf(tmp_path)
        chunks = chunk_text(text)
        chunks = chunks[:20]
        print(f"Processing {len(chunks)} chunks")

        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=chunks
        )

        embeddings = [item.embedding for item in response.data]
        print(f"Generated {len(embeddings)} embeddings")

        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            cur.execute(
                """
                INSERT INTO document_chunks (document_id, collection_id, user_id, content, embedding, chunk_index)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (document_id, collection_id, user_id, chunk, embedding, i)
            )

        conn.commit()

        cur.execute(
            "UPDATE documents SET processing_status = 'completed' WHERE id = %s",
            (document_id,)
        )
        conn.commit()
        print(f"Document {document_id} processed successfully")

    except Exception as e:
        conn.rollback()
        cur.execute(
            "UPDATE documents SET processing_status = 'failed' WHERE id = %s",
            (document_id,)
        )
        conn.commit()
        raise e

    finally:
        cur.close()
        conn.close()
        if tmp_path:
            os.unlink(tmp_path)