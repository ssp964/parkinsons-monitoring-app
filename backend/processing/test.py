from utils import DatabaseUtil  # Assuming util.py contains the DatabaseUtil class


def test_database_connection():
    """
    Tests the connection to the database by establishing and closing it.
    """
    print("\nTesting Database Connection...")

    # Step 1: Initialize Database Connection
    db_util = DatabaseUtil()

    # Step 2: Check if Connection is Active
    try:
        db_util.SessionFactory()
        print("Database connection is active.")
    except Exception as e:
        print(f"Failed to establish connection: {e}")

    # Step 3: Check extract_data method

    subtest_name = "naming"
    df = db_util.extract_data(subtest_name)

    if df is not None and not df.empty:
        print("\nExtracted Data:")
        print(df.to_string(index=False))  # Print without index for better readability
    else:
        print("No data found for the given subtest.")

    # Step 4: Check load_data method
    subtest_id = 1
    extracted_responses = ["dog", "cat", "deer"]
    score = [1, 0, 1, 0]
    aggregated_score = 25
    try:
        db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)
        print("\n Data updated successfully.")
    except Exception as e:
        print(f"Error updating data: {e}")

    # Step : Close the Connection
    db_util.close_connection()
    print("Database connection closed successfully.")


# Run the test function
if __name__ == "__main__":
    test_database_connection()