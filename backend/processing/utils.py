from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pandas as pd
import os
from urllib.parse import quote_plus

from PIL import Image
import io

# Database Configuration Variables
DB_USERNAME = os.getenv("POSTGRES_USER", "admin")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "secret")
DB_HOST = os.getenv("POSTGRES_HOST", "10.0.0.205")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "parkinsons")

DB_URL = f"postgresql://{DB_USERNAME}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

test_id = "6WSG3E_20250309"


class DatabaseUtil:
    def __init__(self):
        """
        Initializes the database connection.
        """
        self.engine = create_engine(DB_URL)
        print(DB_URL)
        self.SessionFactory = sessionmaker(bind=self.engine)
        self.session = self.SessionFactory()  # Safer approach
        print("Database connection established.")

    def extract_data(self, subtest_name, test_id):
        """
        Fetches test records based on the given subtest_name and test_id.

        :param subtest_name: The name of the subtest to filter.
        :return: Pandas DataFrame containing test_id, subtest_id, subtest_name, expected_responses, actual_responses.
        """
        query = """
            SELECT test_id, subtest_id, subtest_name, expected_responses, actual_responses
            FROM test_records
            WHERE subtest_name = :subtest_name AND test_id = :test_id
        """
    # 
        params = {"subtest_name": subtest_name, "test_id": test_id}

        try:
            connection = self.engine.connect()
            result = connection.execute(text(query), params)
            df = pd.DataFrame(result.fetchall(), columns=result.keys())
            return df
        except Exception as e:
            print(f"Error fetching data: {e}")
            return None

    def load_data(self, subtest_id, extracted_responses, score, aggregated_score):
        """
        Inserts extracted responses and score into the test_records table using subtest_id.

        :param subtest_id: The unique identifier for the subtest.
        :param extracted_responses: Extracted responses from the test.
        :param score: Score calculated from the responses.
        :param aggregated_score: Aggregated score.
        """
        query = """
            UPDATE test_records
            SET extracted_responses = :extracted_responses, score = :score, aggregated_score = :aggregated_score
            WHERE subtest_id = :subtest_id
        """

        params = {
            "subtest_id": subtest_id,
            "extracted_responses": extracted_responses,
            "score": score,
            "aggregated_score": aggregated_score,
        }

        try:
            connection = self.engine.connect()
            transaction = connection.begin()  # Start a transaction
            connection.execute(text(query), params)
            transaction.commit()  # Commit the transaction
            print("Data updated successfully.")
        except Exception as e:
            transaction.rollback()  # Rollback in case of error
            print(f"Error updating data: {e}")

    def close_connection(self):
        """
        Closes the database connection.
        """
        self.session.close()
        self.engine.dispose()
        print("Database connection closed.")

    def fetch_image(self, image_id):
        """
        Fetches an image blob from the database and converts it into a PIL Image.

        :param image_id: The ID of the image to retrieve.
        :return: A PIL Image object or None if an error occurs.
        """
        query = """
            SELECT image_data FROM images WHERE image_id = :image_id
        """
        params = {"image_id": image_id}

        try:
            connection = self.engine.connect()
            result = connection.execute(text(query), params).fetchone()

            if result and result[0]:  # Check if result exists
                image_blob = result[0]  # Extract the bytea data
                # image = Image.open(io.BytesIO(image_blob))  # Convert blob to image
                return image_blob
            else:
                print("No image found with the given ID.")
                return None
        except Exception as e:
            print(f"Error fetching image: {e}")
            return None
