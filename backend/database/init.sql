-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;

-- Create function to generate 6 character random ID
CREATE OR REPLACE FUNCTION generate_short_id() 
RETURNS VARCHAR(6) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(6) := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create tables for doctor data
CREATE TABLE IF NOT EXISTS public.doctors (
    doctor_id VARCHAR(6) PRIMARY KEY DEFAULT generate_short_id(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tables for patient data
CREATE TABLE IF NOT EXISTS public.patients (
    patient_id VARCHAR(6) PRIMARY KEY DEFAULT generate_short_id(),
    doctor_email VARCHAR(255),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

<<<<<<< HEAD

=======
CREATE TABLE test_records (
    patient_id VARCHAR(255) NOT NULL, 
    test_id VARCHAR(255),
    subtest_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, 
    subtest_name VARCHAR(255) NOT NULL,
    expected_responses TEXT[], 
    actual_responses TEXT[],
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extracted_responses TEXT[], 
    score INT[], 
    aggregated_score INT
);
>>>>>>> fde257e1c9e799d266deb766194699c6ece7c0c7

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors(email);
CREATE INDEX IF NOT EXISTS idx_test_records ON public.test_records(subtest_id);


-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to concatenate patient_id with date
CREATE OR REPLACE FUNCTION set_test_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.test_id := NEW.patient_id || '_' || TO_CHAR(NEW.timestamp, 'YYYYMMDD');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updating test_id
CREATE TRIGGER test_id_trigger
    BEFORE INSERT ON test_records
    FOR EACH ROW
    EXECUTE FUNCTION set_test_id();