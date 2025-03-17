from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import subprocess

app = FastAPI(
    title="Parkinson's Processing Service",
    description="Service to handle test IDs from mobile app",
)

# Global variable to store the received test_id
received_test_id = None


# Define a data model for incoming requests
class TestIDRequest(BaseModel):
    test_id: str


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/receive-test-id/")
async def receive_test_id(request: TestIDRequest) -> Dict[str, Any]:
    """
    Endpoint to receive test_id from the mobile app.

    Args:
        request: TestIDRequest object containing the test_id

    Returns:
        Dict containing success message and test_id

    Raises:
        HTTPException: If test_id is invalid or empty
    """
    global received_test_id  # Store test_id globally
    if not request.test_id:
        raise HTTPException(status_code=400, detail="Test ID cannot be empty")

    received_test_id = request.test_id  # Store test_id in the variable
    print(f"Received test_id: {received_test_id}")
    # Run speech_processing.py and cdt.py scripts
    subprocess.run(["python3", "processing/speech_processing.py", received_test_id])
    subprocess.run(["python3", "processing/cdt/cdt.py", received_test_id])

    return {"message": "Test ID received successfully", "test_id": received_test_id}



if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5433, reload=True)
