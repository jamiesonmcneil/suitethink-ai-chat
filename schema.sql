CREATE SCHEMA IF NOT EXISTS comms;

CREATE TABLE IF NOT EXISTS comms.user (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comms.user_email (
    id SERIAL PRIMARY KEY,
    fk_user_id INTEGER REFERENCES comms.user(id),
    email VARCHAR(255) NOT NULL,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comms.transcript (
    id SERIAL PRIMARY KEY,
    transcript TEXT NOT NULL,
    is_require_followup BOOLEAN DEFAULT FALSE,
    followup_method VARCHAR(50),
    followup_request_date TIMESTAMP,
    followup_complete_date TIMESTAMP,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist
ALTER TABLE comms.transcript
ADD COLUMN IF NOT EXISTS is_require_followup BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS followup_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS followup_request_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS followup_complete_date TIMESTAMP;
