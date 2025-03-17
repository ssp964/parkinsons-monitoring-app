from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


# Define request model
class TestRequest(BaseModel):
    test_id: int


@app.post("/submit-test")
async def receive_test_id(request: TestRequest):
    """
    Extracts test_id from the HTTP request and returns it.
    """
    test_id = request.test_id  # Extract test_id
    return {"extracted_test_id": test_id}
