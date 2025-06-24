CREATE SCHEMA IF NOT EXISTS comms;

CREATE TABLE comms.user (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone_number VARCHAR(255),
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  fk_user_id_updated BIGINT DEFAULT 1
);

CREATE TABLE comms.user_email (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  fk_user_id BIGINT REFERENCES comms.user(id),
  email VARCHAR(255) UNIQUE,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  fk_user_id_updated BIGINT DEFAULT 1
);

CREATE TABLE comms.user_phone (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  fk_user_id BIGINT REFERENCES comms.user(id),
  phone_number VARCHAR(255) UNIQUE,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  fk_user_id_updated BIGINT DEFAULT 1
);

CREATE TABLE comms.user_consent (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  fk_user_id INTEGER,
  is_consent BOOLEAN NOT NULL,
  consent_keyword VARCHAR(255) NOT NULL,
  fk_property_email VARCHAR(255),
  fk_property_phone VARCHAR(255),
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comms.transcript (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  transcript TEXT NOT NULL,
  is_require_followup BOOLEAN DEFAULT false,
  followup_method VARCHAR(50),
  fk_user_email_id BIGINT REFERENCES comms.user_email(id),
  fk_user_phone_id BIGINT REFERENCES comms.user_phone(id),
  followup_request_date TIMESTAMP,
  followup_complete_date TIMESTAMP,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  fk_user_id_updated BIGINT DEFAULT 1
);

CREATE TABLE comms.scraped_data_frequent (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  uuid UUID DEFAULT gen_random_uuid(),
  fk_property_id INTEGER,
  data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fk_user_id_updated INTEGER DEFAULT 1
);

CREATE TABLE comms.scraped_data_infrequent (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  uuid UUID DEFAULT gen_random_uuid(),
  fk_property_id INTEGER,
  data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fk_user_id_updated INTEGER DEFAULT 1
);

CREATE TABLE comms.ai_rules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  uuid VARCHAR(36) DEFAULT core.uuid_generate_v4(),
  fk_property_id BIGINT,
  rule_key VARCHAR(50) NOT NULL,
  rule_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fk_user_id_updated BIGINT DEFAULT 1
);

CREATE TABLE comms.user_activity (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  fk_user_id BIGINT REFERENCES comms.user(id),
  channel VARCHAR(20) NOT NULL,
  fk_user_email_id BIGINT REFERENCES comms.user_email(id),
  fk_user_phone_id BIGINT REFERENCES comms.user_phone(id),
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  fk_user_id_updated BIGINT DEFAULT 1
);

CREATE TABLE comms.user_activity_item (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  fk_user_activity_id BIGINT REFERENCES comms.user_activity(id),
  message_text TEXT NOT NULL,
  sender VARCHAR(20) NOT NULL,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  fk_user_id_updated BIGINT DEFAULT 1
);
