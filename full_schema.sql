--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Homebrew)
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: comms; Type: SCHEMA; Schema: -; Owner: stadmin
--

CREATE SCHEMA comms;


ALTER SCHEMA comms OWNER TO stadmin;

--
-- Name: core; Type: SCHEMA; Schema: -; Owner: stadmin
--

CREATE SCHEMA core;


ALTER SCHEMA core OWNER TO stadmin;

--
-- Name: crm; Type: SCHEMA; Schema: -; Owner: stadmin
--

CREATE SCHEMA crm;


ALTER SCHEMA crm OWNER TO stadmin;

--
-- Name: dblink; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS dblink WITH SCHEMA core;


--
-- Name: EXTENSION dblink; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION dblink IS 'connect to other PostgreSQL databases from within a database';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA core;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA core;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: fn_get_lt_id_by_name_entity_parent(character varying, integer); Type: FUNCTION; Schema: core; Owner: stadmin
--

CREATE FUNCTION core.fn_get_lt_id_by_name_entity_parent(in_name character varying, in_fk_lt_id_parent integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  lt_id INT;
BEGIN
  SELECT lt.id
  INTO lt_id
  FROM core.lookup_type lt
  WHERE lt.name = in_name
    AND COALESCE(lt.fk_lt_id_parent, 0) = COALESCE(in_fk_lt_id_parent, COALESCE(lt.fk_lt_id_parent, 0))
    AND lt.is_active = TRUE
    AND lt.is_deleted = FALSE;

  RETURN lt_id;
END;
$$;


ALTER FUNCTION core.fn_get_lt_id_by_name_entity_parent(in_name character varying, in_fk_lt_id_parent integer) OWNER TO stadmin;

--
-- Name: fn_get_lv_by_id(bigint); Type: FUNCTION; Schema: core; Owner: stadmin
--

CREATE FUNCTION core.fn_get_lv_by_id(in_lv_id bigint) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  lv_value VARCHAR(255);
BEGIN
  SELECT 
    CASE lt.fk_lv_data_type
      WHEN 1 THEN lv.value_string
      WHEN 2 THEN CAST(lv.value_numeric AS VARCHAR(255))
      WHEN 3 THEN CAST(lv.value_boolean AS VARCHAR(255))
      WHEN 4 THEN CAST(lv.value_date AS VARCHAR(255))
      WHEN 5 THEN CAST(encode(lv.value_blob, 'base64') AS VARCHAR(255))
      WHEN 6 THEN LEFT(lv.value_text, 255)
      ELSE NULL
    END
  INTO lv_value
  FROM core.lookup_value lv
  INNER JOIN core.lookup_type lt ON lt.id = lv.fk_lt_id
  WHERE lv.id = in_lv_id
    AND lv.is_active = TRUE
    AND lv.is_deleted = FALSE;

  RETURN lv_value;
END;
$$;


ALTER FUNCTION core.fn_get_lv_by_id(in_lv_id bigint) OWNER TO stadmin;

--
-- Name: fn_get_lv_id_by_value(character varying, character varying, integer); Type: FUNCTION; Schema: core; Owner: stadmin
--

CREATE FUNCTION core.fn_get_lv_id_by_value(in_value character varying, in_type_name character varying, in_type_id integer) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
  lv_id BIGINT;
BEGIN
  SELECT lv.id
  INTO lv_id
  FROM core.lookup_value lv
  INNER JOIN core.lookup_type lt ON lt.id = lv.fk_lt_id
  WHERE 
    CASE lt.fk_lv_data_type
      WHEN 1 THEN lv.value_string = in_value
      WHEN 2 THEN lv.value_numeric = CAST(in_value AS DECIMAL(20,4))
      WHEN 3 THEN lv.value_boolean = CAST(in_value AS SMALLINT)
      WHEN 4 THEN lv.value_date = CAST(in_value AS DATE)
      ELSE FALSE
    END
    AND (
      lt.id = COALESCE(NULLIF(in_type_id, NULL), lt.id)
      OR
      lt.name = COALESCE(NULLIF(in_type_name, ''), lt.name)
    )
    AND lv.is_active = TRUE
    AND lv.is_deleted = FALSE;

  RETURN lv_id;
END;
$$;


ALTER FUNCTION core.fn_get_lv_id_by_value(in_value character varying, in_type_name character varying, in_type_id integer) OWNER TO stadmin;

--
-- Name: fn_get_user_setting_value_by_lt_id(integer, bigint); Type: FUNCTION; Schema: core; Owner: stadmin
--

CREATE FUNCTION core.fn_get_user_setting_value_by_lt_id(in_fk_lt_id integer, in_fk_user_id bigint) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  setting_value VARCHAR(255);
BEGIN
  SELECT
    CASE 
      WHEN us.fk_lv_id IS NULL THEN 
        CASE lt.fk_lv_data_type
          WHEN 1 THEN us.value_string
          WHEN 2 THEN CAST(us.value_numeric AS VARCHAR(255))
          WHEN 3 THEN CAST(us.value_boolean AS VARCHAR(255))
          WHEN 4 THEN CAST(us.value_date AS VARCHAR(255))
          WHEN 5 THEN CAST(encode(us.value_blob, 'base64') AS VARCHAR(255))
          WHEN 6 THEN LEFT(us.value_text, 255)
          ELSE NULL
        END
      ELSE 
        CASE lt.fk_lv_data_type
          WHEN 1 THEN lv.value_string
          WHEN 2 THEN CAST(lv.value_numeric AS VARCHAR(255))
          WHEN 3 THEN CAST(lv.value_boolean AS VARCHAR(255))
          WHEN 4 THEN CAST(lv.value_date AS VARCHAR(255))
          WHEN 5 THEN CAST(encode(lv.value_blob, 'base64') AS VARCHAR(255))
          WHEN 6 THEN LEFT(lv.value_text, 255)
          ELSE NULL
        END
    END
  INTO setting_value
  FROM core.user_setting us
  INNER JOIN core.lookup_type lt ON lt.id = us.fk_lt_id
  LEFT JOIN core.lookup_value lv ON lv.fk_lt_id = lt.id AND us.fk_lv_id = lv.id 
  WHERE 
    us.fk_lt_id = in_fk_lt_id
    AND us.fk_user_id = in_fk_user_id
    AND us.is_active = TRUE
    AND us.is_deleted = FALSE;

  RETURN setting_value;
END;
$$;


ALTER FUNCTION core.fn_get_user_setting_value_by_lt_id(in_fk_lt_id integer, in_fk_user_id bigint) OWNER TO stadmin;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: core; Owner: stadmin
--

CREATE FUNCTION core.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.update_date = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION core.update_timestamp() OWNER TO stadmin;

--
-- Name: fn_get_lt_id_by_name_entity_parent(character varying, integer); Type: FUNCTION; Schema: crm; Owner: stadmin
--

CREATE FUNCTION crm.fn_get_lt_id_by_name_entity_parent(in_name character varying, in_fk_lt_id_parent integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  lt_id INT;
BEGIN
  SELECT lt.id
  INTO lt_id
  FROM crm.lookup_type lt
  WHERE lt.name = in_name
    AND COALESCE(lt.fk_lt_id_parent, 0) = COALESCE(in_fk_lt_id_parent, COALESCE(lt.fk_lt_id_parent, 0))
    AND lt.is_active = TRUE
    AND lt.is_deleted = FALSE;

  RETURN lt_id;
END;
$$;


ALTER FUNCTION crm.fn_get_lt_id_by_name_entity_parent(in_name character varying, in_fk_lt_id_parent integer) OWNER TO stadmin;

--
-- Name: fn_get_lv_by_id(bigint); Type: FUNCTION; Schema: crm; Owner: stadmin
--

CREATE FUNCTION crm.fn_get_lv_by_id(in_lv_id bigint) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  lv_value VARCHAR(255);
BEGIN
  SELECT 
    CASE lt.fk_lv_data_type
      WHEN 1 THEN lv.value_string
      WHEN 2 THEN CAST(lv.value_numeric AS VARCHAR(255))
      WHEN 3 THEN CAST(lv.value_boolean AS VARCHAR(255))
      WHEN 4 THEN CAST(lv.value_date AS VARCHAR(255))
      WHEN 5 THEN CAST(encode(lv.value_blob, 'base64') AS VARCHAR(255))
      WHEN 6 THEN LEFT(lv.value_text, 255)
      ELSE NULL
    END
  INTO lv_value
  FROM crm.lookup_value lv
  INNER JOIN crm.lookup_type lt ON lt.id = lv.fk_lt_id
  WHERE lv.id = in_lv_id
    AND lv.is_active = TRUE
    AND lv.is_deleted = FALSE;

  RETURN lv_value;
END;
$$;


ALTER FUNCTION crm.fn_get_lv_by_id(in_lv_id bigint) OWNER TO stadmin;

--
-- Name: fn_get_lv_id_by_value(character varying, character varying, integer); Type: FUNCTION; Schema: crm; Owner: stadmin
--

CREATE FUNCTION crm.fn_get_lv_id_by_value(in_value character varying, in_type_name character varying, in_type_id integer) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
  lv_id BIGINT;
BEGIN
  SELECT lv.id
  INTO lv_id
  FROM crm.lookup_value lv
  INNER JOIN crm.lookup_type lt ON lt.id = lv.fk_lt_id
  WHERE 
    CASE lt.fk_lv_data_type
      WHEN 1 THEN lv.value_string = in_value
      WHEN 2 THEN lv.value_numeric = CAST(in_value AS DECIMAL(20,4))
      WHEN 3 THEN lv.value_boolean = CAST(in_value AS SMALLINT)
      WHEN 4 THEN lv.value_date = CAST(in_value AS DATE)
      ELSE FALSE
    END
    AND (
      lt.id = COALESCE(NULLIF(in_type_id, NULL), lt.id)
      OR
      lt.name = COALESCE(NULLIF(in_type_name, ''), lt.name)
    )
    AND lv.is_active = TRUE
    AND lv.is_deleted = FALSE;

  RETURN lv_id;
END;
$$;


ALTER FUNCTION crm.fn_get_lv_id_by_value(in_value character varying, in_type_name character varying, in_type_id integer) OWNER TO stadmin;

--
-- Name: fn_get_user_setting_value_by_lt_id(integer, bigint); Type: FUNCTION; Schema: crm; Owner: stadmin
--

CREATE FUNCTION crm.fn_get_user_setting_value_by_lt_id(in_fk_lt_id integer, in_fk_user_id bigint) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  setting_value VARCHAR(255);
BEGIN
  SELECT
    CASE 
      WHEN us.fk_lv_id IS NULL THEN 
        CASE lt.fk_lv_data_type
          WHEN 1 THEN us.value_string
          WHEN 2 THEN CAST(us.value_numeric AS VARCHAR(255))
          WHEN 3 THEN CAST(us.value_boolean AS VARCHAR(255))
          WHEN 4 THEN CAST(us.value_date AS VARCHAR(255))
          WHEN 5 THEN CAST(encode(us.value_blob, 'base64') AS VARCHAR(255))
          WHEN 6 THEN LEFT(us.value_text, 255)
          ELSE NULL
        END
      ELSE 
        CASE lt.fk_lv_data_type
          WHEN 1 THEN lv.value_string
          WHEN 2 THEN CAST(lv.value_numeric AS VARCHAR(255))
          WHEN 3 THEN CAST(lv.value_boolean AS VARCHAR(255))
          WHEN 4 THEN CAST(lv.value_date AS VARCHAR(255))
          WHEN 5 THEN CAST(encode(lv.value_blob, 'base64') AS VARCHAR(255))
          WHEN 6 THEN LEFT(lv.value_text, 255)
          ELSE NULL
        END
    END
  INTO setting_value
  FROM crm.user_setting us
  INNER JOIN crm.lookup_type lt ON lt.id = us.fk_lt_id
  LEFT JOIN crm.lookup_value lv ON lv.fk_lt_id = lt.id AND us.fk_lv_id = lv.id 
  WHERE 
    us.fk_lt_id = in_fk_lt_id
    AND us.fk_user_id = in_fk_user_id
    AND us.is_active = TRUE
    AND us.is_deleted = FALSE;

  RETURN setting_value;
END;
$$;


ALTER FUNCTION crm.fn_get_user_setting_value_by_lt_id(in_fk_lt_id integer, in_fk_user_id bigint) OWNER TO stadmin;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: crm; Owner: stadmin
--

CREATE FUNCTION crm.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.update_date = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION crm.update_timestamp() OWNER TO stadmin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_rules; Type: TABLE; Schema: comms; Owner: jamieson
--

CREATE TABLE comms.ai_rules (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL,
    fk_property_id bigint NOT NULL,
    rule_key character varying(50) NOT NULL,
    rule_value text NOT NULL
);


ALTER TABLE comms.ai_rules OWNER TO jamieson;

--
-- Name: ai_rules_id_seq; Type: SEQUENCE; Schema: comms; Owner: jamieson
--

CREATE SEQUENCE comms.ai_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.ai_rules_id_seq OWNER TO jamieson;

--
-- Name: ai_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: jamieson
--

ALTER SEQUENCE comms.ai_rules_id_seq OWNED BY comms.ai_rules.id;


--
-- Name: consent_keyword; Type: TABLE; Schema: comms; Owner: jamieson
--

CREATE TABLE comms.consent_keyword (
    id integer NOT NULL,
    keyword character varying(255) NOT NULL,
    consent_type character varying(50) NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE comms.consent_keyword OWNER TO jamieson;

--
-- Name: consent_keyword_id_seq; Type: SEQUENCE; Schema: comms; Owner: jamieson
--

CREATE SEQUENCE comms.consent_keyword_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.consent_keyword_id_seq OWNER TO jamieson;

--
-- Name: consent_keyword_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: jamieson
--

ALTER SEQUENCE comms.consent_keyword_id_seq OWNED BY comms.consent_keyword.id;


--
-- Name: contact_us; Type: TABLE; Schema: comms; Owner: jamieson
--

CREATE TABLE comms.contact_us (
    id integer NOT NULL,
    query text NOT NULL,
    method character varying(50) NOT NULL,
    email character varying(255),
    phone character varying(20),
    name character varying(255),
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE comms.contact_us OWNER TO jamieson;

--
-- Name: contact_us_id_seq; Type: SEQUENCE; Schema: comms; Owner: jamieson
--

CREATE SEQUENCE comms.contact_us_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.contact_us_id_seq OWNER TO jamieson;

--
-- Name: contact_us_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: jamieson
--

ALTER SEQUENCE comms.contact_us_id_seq OWNED BY comms.contact_us.id;


--
-- Name: property; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms.property (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL,
    property_name character varying(255) NOT NULL,
    scrape_url character varying(255) NOT NULL,
    contact_number character varying(255),
    contact_email character varying(255)
);


ALTER TABLE comms.property OWNER TO stadmin;

--
-- Name: property_consent_text; Type: TABLE; Schema: comms; Owner: jamieson
--

CREATE TABLE comms.property_consent_text (
    id integer NOT NULL,
    fk_property_id integer,
    consent_text text NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE comms.property_consent_text OWNER TO jamieson;

--
-- Name: property_consent_text_id_seq; Type: SEQUENCE; Schema: comms; Owner: jamieson
--

CREATE SEQUENCE comms.property_consent_text_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.property_consent_text_id_seq OWNER TO jamieson;

--
-- Name: property_consent_text_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: jamieson
--

ALTER SEQUENCE comms.property_consent_text_id_seq OWNED BY comms.property_consent_text.id;


--
-- Name: property_id_seq; Type: SEQUENCE; Schema: comms; Owner: stadmin
--

CREATE SEQUENCE comms.property_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.property_id_seq OWNER TO stadmin;

--
-- Name: property_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: stadmin
--

ALTER SEQUENCE comms.property_id_seq OWNED BY comms.property.id;


--
-- Name: property_phone; Type: TABLE; Schema: comms; Owner: jamieson
--

CREATE TABLE comms.property_phone (
    id integer NOT NULL,
    fk_property_id integer,
    phone_number character varying(20) NOT NULL,
    purpose character varying(50) NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE comms.property_phone OWNER TO jamieson;

--
-- Name: property_phone_id_seq; Type: SEQUENCE; Schema: comms; Owner: jamieson
--

CREATE SEQUENCE comms.property_phone_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.property_phone_id_seq OWNER TO jamieson;

--
-- Name: property_phone_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: jamieson
--

ALTER SEQUENCE comms.property_phone_id_seq OWNED BY comms.property_phone.id;


--
-- Name: scrape_rules; Type: TABLE; Schema: comms; Owner: jamieson
--

CREATE TABLE comms.scrape_rules (
    id integer NOT NULL,
    fk_property_id integer,
    data_type character varying(50) NOT NULL,
    refresh_interval integer NOT NULL,
    last_scraped timestamp without time zone,
    is_active boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_user_id_updated integer DEFAULT 1
);


ALTER TABLE comms.scrape_rules OWNER TO jamieson;

--
-- Name: scrape_rules_id_seq; Type: SEQUENCE; Schema: comms; Owner: jamieson
--

CREATE SEQUENCE comms.scrape_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.scrape_rules_id_seq OWNER TO jamieson;

--
-- Name: scrape_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: jamieson
--

ALTER SEQUENCE comms.scrape_rules_id_seq OWNED BY comms.scrape_rules.id;


--
-- Name: scraped_data; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms.scraped_data (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL,
    fk_property_id bigint NOT NULL,
    data jsonb NOT NULL
);


ALTER TABLE comms.scraped_data OWNER TO stadmin;

--
-- Name: scraped_data_frequent; Type: TABLE; Schema: comms; Owner: jamieson
--

CREATE TABLE comms.scraped_data_frequent (
    id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid(),
    fk_property_id integer,
    data jsonb NOT NULL,
    is_active boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_user_id_updated integer DEFAULT 1
);


ALTER TABLE comms.scraped_data_frequent OWNER TO jamieson;

--
-- Name: scraped_data_frequent_id_seq; Type: SEQUENCE; Schema: comms; Owner: jamieson
--

CREATE SEQUENCE comms.scraped_data_frequent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.scraped_data_frequent_id_seq OWNER TO jamieson;

--
-- Name: scraped_data_frequent_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: jamieson
--

ALTER SEQUENCE comms.scraped_data_frequent_id_seq OWNED BY comms.scraped_data_frequent.id;


--
-- Name: scraped_data_frequent_temp; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms.scraped_data_frequent_temp (
    id integer DEFAULT nextval('comms.scraped_data_frequent_id_seq'::regclass) NOT NULL,
    uuid uuid DEFAULT gen_random_uuid(),
    fk_property_id integer,
    data jsonb NOT NULL,
    is_active boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_user_id_updated integer DEFAULT 1
);


ALTER TABLE comms.scraped_data_frequent_temp OWNER TO stadmin;

--
-- Name: scraped_data_id_seq; Type: SEQUENCE; Schema: comms; Owner: stadmin
--

CREATE SEQUENCE comms.scraped_data_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.scraped_data_id_seq OWNER TO stadmin;

--
-- Name: scraped_data_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: stadmin
--

ALTER SEQUENCE comms.scraped_data_id_seq OWNED BY comms.scraped_data.id;


--
-- Name: scraped_data_infrequent; Type: TABLE; Schema: comms; Owner: jamieson
--

CREATE TABLE comms.scraped_data_infrequent (
    id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid(),
    fk_property_id integer,
    data jsonb NOT NULL,
    is_active boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_user_id_updated integer DEFAULT 1
);


ALTER TABLE comms.scraped_data_infrequent OWNER TO jamieson;

--
-- Name: scraped_data_infrequent_id_seq; Type: SEQUENCE; Schema: comms; Owner: jamieson
--

CREATE SEQUENCE comms.scraped_data_infrequent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.scraped_data_infrequent_id_seq OWNER TO jamieson;

--
-- Name: scraped_data_infrequent_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: jamieson
--

ALTER SEQUENCE comms.scraped_data_infrequent_id_seq OWNED BY comms.scraped_data_infrequent.id;


--
-- Name: scraped_data_infrequent_temp; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms.scraped_data_infrequent_temp (
    id integer DEFAULT nextval('comms.scraped_data_infrequent_id_seq'::regclass) NOT NULL,
    uuid uuid DEFAULT gen_random_uuid(),
    fk_property_id integer,
    data jsonb NOT NULL,
    is_active boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_user_id_updated integer DEFAULT 1
);


ALTER TABLE comms.scraped_data_infrequent_temp OWNER TO stadmin;

--
-- Name: stock_text; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms.stock_text (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL,
    fk_property_id bigint NOT NULL,
    text_key character varying(50) NOT NULL,
    text_value text NOT NULL
);


ALTER TABLE comms.stock_text OWNER TO stadmin;

--
-- Name: stock_text_id_seq; Type: SEQUENCE; Schema: comms; Owner: stadmin
--

CREATE SEQUENCE comms.stock_text_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.stock_text_id_seq OWNER TO stadmin;

--
-- Name: stock_text_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: stadmin
--

ALTER SEQUENCE comms.stock_text_id_seq OWNED BY comms.stock_text.id;


--
-- Name: support_requests; Type: TABLE; Schema: comms; Owner: jamieson
--

CREATE TABLE comms.support_requests (
    id integer NOT NULL,
    query text NOT NULL,
    method character varying(50) NOT NULL,
    email character varying(255),
    phone character varying(20),
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE comms.support_requests OWNER TO jamieson;

--
-- Name: support_requests_id_seq; Type: SEQUENCE; Schema: comms; Owner: jamieson
--

CREATE SEQUENCE comms.support_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.support_requests_id_seq OWNER TO jamieson;

--
-- Name: support_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: jamieson
--

ALTER SEQUENCE comms.support_requests_id_seq OWNED BY comms.support_requests.id;


--
-- Name: transcript; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms.transcript (
    id integer NOT NULL,
    uuid character varying DEFAULT core.uuid_generate_v4(),
    transcript text NOT NULL,
    is_require_followup boolean DEFAULT false,
    followup_method character varying(50),
    followup_request_date timestamp without time zone,
    followup_complete_date timestamp without time zone,
    fk_user_email_id bigint,
    fk_user_phone_id bigint,
    is_active boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_user_id_updated bigint
);


ALTER TABLE comms.transcript OWNER TO stadmin;

--
-- Name: transcripts_id_seq; Type: SEQUENCE; Schema: comms; Owner: stadmin
--

CREATE SEQUENCE comms.transcripts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.transcripts_id_seq OWNER TO stadmin;

--
-- Name: transcripts_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: stadmin
--

ALTER SEQUENCE comms.transcripts_id_seq OWNED BY comms.transcript.id;


--
-- Name: user; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms."user" (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    screen_name character varying(55) DEFAULT NULL::character varying,
    email character varying(255) DEFAULT NULL::character varying,
    first_name character varying(255) DEFAULT NULL::character varying,
    last_name character varying(255) DEFAULT NULL::character varying,
    password character varying(255) DEFAULT NULL::character varying,
    phone_number character varying(255) DEFAULT NULL::character varying,
    address character varying(500) DEFAULT NULL::character varying,
    city character varying(25) DEFAULT NULL::character varying,
    zipcode character varying(45) DEFAULT NULL::character varying,
    profile_image character varying(255) DEFAULT NULL::character varying,
    temporary_key character varying(36) DEFAULT NULL::character varying,
    password_reset_date timestamp without time zone,
    last_login_date timestamp without time zone,
    fk_country_id integer,
    fk_state_id integer,
    fk_lv_user_type integer,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE comms."user" OWNER TO stadmin;

--
-- Name: user_activity; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms.user_activity (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL,
    fk_user_id bigint NOT NULL,
    fk_user_phone_id bigint,
    fk_user_email_id bigint,
    channel character varying(20) NOT NULL
);


ALTER TABLE comms.user_activity OWNER TO stadmin;

--
-- Name: user_activity_id_seq; Type: SEQUENCE; Schema: comms; Owner: stadmin
--

CREATE SEQUENCE comms.user_activity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.user_activity_id_seq OWNER TO stadmin;

--
-- Name: user_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: stadmin
--

ALTER SEQUENCE comms.user_activity_id_seq OWNED BY comms.user_activity.id;


--
-- Name: user_activity_item; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms.user_activity_item (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL,
    fk_user_activity_id bigint NOT NULL,
    sender character varying(20) NOT NULL,
    message_text text NOT NULL
);


ALTER TABLE comms.user_activity_item OWNER TO stadmin;

--
-- Name: user_activity_item_id_seq; Type: SEQUENCE; Schema: comms; Owner: stadmin
--

CREATE SEQUENCE comms.user_activity_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.user_activity_item_id_seq OWNER TO stadmin;

--
-- Name: user_activity_item_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: stadmin
--

ALTER SEQUENCE comms.user_activity_item_id_seq OWNED BY comms.user_activity_item.id;


--
-- Name: user_consent; Type: TABLE; Schema: comms; Owner: jamieson
--

CREATE TABLE comms.user_consent (
    id integer NOT NULL,
    fk_user_id integer,
    fk_property_phone integer,
    fk_property_email character varying(255),
    is_consent boolean NOT NULL,
    consent_keyword character varying(255) NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE comms.user_consent OWNER TO jamieson;

--
-- Name: user_consent_id_seq; Type: SEQUENCE; Schema: comms; Owner: jamieson
--

CREATE SEQUENCE comms.user_consent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.user_consent_id_seq OWNER TO jamieson;

--
-- Name: user_consent_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: jamieson
--

ALTER SEQUENCE comms.user_consent_id_seq OWNED BY comms.user_consent.id;


--
-- Name: user_email; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms.user_email (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL,
    fk_user_id bigint NOT NULL,
    email character varying(255) NOT NULL,
    is_primary boolean DEFAULT false
);


ALTER TABLE comms.user_email OWNER TO stadmin;

--
-- Name: user_email_id_seq; Type: SEQUENCE; Schema: comms; Owner: stadmin
--

CREATE SEQUENCE comms.user_email_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.user_email_id_seq OWNER TO stadmin;

--
-- Name: user_email_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: stadmin
--

ALTER SEQUENCE comms.user_email_id_seq OWNED BY comms.user_email.id;


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: comms; Owner: stadmin
--

CREATE SEQUENCE comms.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.user_id_seq OWNER TO stadmin;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: stadmin
--

ALTER SEQUENCE comms.user_id_seq OWNED BY comms."user".id;


--
-- Name: user_phone; Type: TABLE; Schema: comms; Owner: stadmin
--

CREATE TABLE comms.user_phone (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL,
    fk_user_id bigint NOT NULL,
    phone_number character varying(255) NOT NULL,
    is_primary boolean DEFAULT false
);


ALTER TABLE comms.user_phone OWNER TO stadmin;

--
-- Name: user_phone_id_seq; Type: SEQUENCE; Schema: comms; Owner: stadmin
--

CREATE SEQUENCE comms.user_phone_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE comms.user_phone_id_seq OWNER TO stadmin;

--
-- Name: user_phone_id_seq; Type: SEQUENCE OWNED BY; Schema: comms; Owner: stadmin
--

ALTER SEQUENCE comms.user_phone_id_seq OWNED BY comms.user_phone.id;


--
-- Name: country; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.country (
    id integer NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    name character varying(100) DEFAULT NULL::character varying,
    abbreviation character varying(3) DEFAULT NULL::character varying,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.country OWNER TO stadmin;

--
-- Name: country_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.country_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.country_id_seq OWNER TO stadmin;

--
-- Name: country_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.country_id_seq OWNED BY core.country.id;


--
-- Name: entity; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.entity (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    name character varying(255) DEFAULT NULL::character varying,
    title character varying(500) DEFAULT NULL::character varying,
    description character varying(2000) DEFAULT NULL::character varying,
    fk_entity_id_parent bigint,
    fk_lv_entity_type bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.entity OWNER TO stadmin;

--
-- Name: entity_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.entity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.entity_id_seq OWNER TO stadmin;

--
-- Name: entity_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.entity_id_seq OWNED BY core.entity.id;


--
-- Name: entity_service; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.entity_service (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    fk_entity_id bigint,
    fk_lv_id_service bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.entity_service OWNER TO stadmin;

--
-- Name: entity_service_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.entity_service_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.entity_service_id_seq OWNER TO stadmin;

--
-- Name: entity_service_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.entity_service_id_seq OWNED BY core.entity_service.id;


--
-- Name: entity_setting; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.entity_setting (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    value_string character varying(255) DEFAULT NULL::character varying,
    value_numeric numeric(20,4) DEFAULT NULL::numeric,
    value_boolean integer,
    value_date date,
    value_text text,
    fk_entity_id bigint,
    fk_lt_id integer,
    fk_lv_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.entity_setting OWNER TO stadmin;

--
-- Name: entity_setting_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.entity_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.entity_setting_id_seq OWNER TO stadmin;

--
-- Name: entity_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.entity_setting_id_seq OWNED BY core.entity_setting.id;


--
-- Name: log_error; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.log_error (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    source character varying(255) DEFAULT NULL::character varying,
    message character varying(500) DEFAULT NULL::character varying,
    detail character varying(1500) DEFAULT NULL::character varying,
    raw text,
    fk_lv_log_error_type bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.log_error OWNER TO stadmin;

--
-- Name: log_error_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.log_error_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.log_error_id_seq OWNER TO stadmin;

--
-- Name: log_error_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.log_error_id_seq OWNED BY core.log_error.id;


--
-- Name: lookup_type; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.lookup_type (
    id integer NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) DEFAULT NULL::character varying,
    description character varying(500) DEFAULT NULL::character varying,
    comment character varying(1000) DEFAULT NULL::character varying,
    sort integer DEFAULT 100,
    is_many integer DEFAULT 0,
    is_lookup_value integer DEFAULT 1,
    fk_lt_id_parent integer,
    fk_lv_data_type integer DEFAULT 1 NOT NULL,
    fk_lv_input_type integer,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.lookup_type OWNER TO stadmin;

--
-- Name: lookup_type_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.lookup_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.lookup_type_id_seq OWNER TO stadmin;

--
-- Name: lookup_type_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.lookup_type_id_seq OWNED BY core.lookup_type.id;


--
-- Name: lookup_value; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.lookup_value (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    value_numeric numeric(20,4) DEFAULT NULL::numeric,
    value_string character varying(255) DEFAULT NULL::character varying,
    value_boolean smallint,
    value_date date,
    value_text text,
    sort integer DEFAULT 100,
    description character varying(500) DEFAULT NULL::character varying,
    lookup_valuecol character varying(45) DEFAULT NULL::character varying,
    fk_lt_id integer,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.lookup_value OWNER TO stadmin;

--
-- Name: lookup_value_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.lookup_value_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.lookup_value_id_seq OWNER TO stadmin;

--
-- Name: lookup_value_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.lookup_value_id_seq OWNED BY core.lookup_value.id;


--
-- Name: state; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.state (
    id integer NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    name character varying(50) DEFAULT NULL::character varying,
    abbreviation character varying(3) DEFAULT NULL::character varying,
    fk_country_id integer DEFAULT 1,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated integer DEFAULT 1 NOT NULL
);


ALTER TABLE core.state OWNER TO stadmin;

--
-- Name: state_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.state_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.state_id_seq OWNER TO stadmin;

--
-- Name: state_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.state_id_seq OWNED BY core.state.id;


--
-- Name: user; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core."user" (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    screen_name character varying(55) DEFAULT NULL::character varying,
    email character varying(255) DEFAULT NULL::character varying,
    first_name character varying(255) DEFAULT NULL::character varying,
    last_name character varying(255) DEFAULT NULL::character varying,
    password character varying(255) DEFAULT NULL::character varying,
    phone_number character varying(255) DEFAULT NULL::character varying,
    address character varying(500) DEFAULT NULL::character varying,
    city character varying(25) DEFAULT NULL::character varying,
    zipcode character varying(45) DEFAULT NULL::character varying,
    profile_image character varying(255) DEFAULT NULL::character varying,
    temporary_key character varying(36) DEFAULT NULL::character varying,
    password_reset_date timestamp without time zone,
    last_login_date timestamp without time zone,
    fk_country_id integer,
    fk_state_id integer,
    fk_lv_user_type integer,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core."user" OWNER TO stadmin;

--
-- Name: user_group; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.user_group (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    name character varying(255) DEFAULT NULL::character varying,
    title character varying(500) DEFAULT NULL::character varying,
    description character varying(2000) DEFAULT NULL::character varying,
    fk_lv_user_group_type integer,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.user_group OWNER TO stadmin;

--
-- Name: user_group_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.user_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.user_group_id_seq OWNER TO stadmin;

--
-- Name: user_group_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.user_group_id_seq OWNED BY core.user_group.id;


--
-- Name: user_group_setting; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.user_group_setting (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    value_string character varying(255) DEFAULT NULL::character varying,
    value_numeric numeric(20,4) DEFAULT NULL::numeric,
    value_boolean integer,
    value_date date,
    value_text text,
    fk_user_group_id bigint,
    fk_lt_id integer,
    fk_lv_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.user_group_setting OWNER TO stadmin;

--
-- Name: user_group_setting_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.user_group_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.user_group_setting_id_seq OWNER TO stadmin;

--
-- Name: user_group_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.user_group_setting_id_seq OWNED BY core.user_group_setting.id;


--
-- Name: user_group_user; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.user_group_user (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    fk_user_id bigint,
    fk_user_group_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.user_group_user OWNER TO stadmin;

--
-- Name: user_group_user_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.user_group_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.user_group_user_id_seq OWNER TO stadmin;

--
-- Name: user_group_user_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.user_group_user_id_seq OWNED BY core.user_group_user.id;


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.user_id_seq OWNER TO stadmin;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.user_id_seq OWNED BY core."user".id;


--
-- Name: user_setting; Type: TABLE; Schema: core; Owner: stadmin
--

CREATE TABLE core.user_setting (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    value_string character varying(255) DEFAULT NULL::character varying,
    value_numeric numeric(20,4) DEFAULT NULL::numeric,
    value_boolean integer,
    value_date date,
    value_text text,
    fk_user_id bigint,
    fk_lt_id integer,
    fk_lv_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE core.user_setting OWNER TO stadmin;

--
-- Name: user_setting_id_seq; Type: SEQUENCE; Schema: core; Owner: stadmin
--

CREATE SEQUENCE core.user_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.user_setting_id_seq OWNER TO stadmin;

--
-- Name: user_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: stadmin
--

ALTER SEQUENCE core.user_setting_id_seq OWNED BY core.user_setting.id;


--
-- Name: account; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.account (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    account_number character varying(100) DEFAULT NULL::character varying,
    start_date date,
    end_date date,
    fk_core_entity_id bigint,
    fk_lv_account_status bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.account OWNER TO stadmin;

--
-- Name: account_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.account_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.account_id_seq OWNER TO stadmin;

--
-- Name: account_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.account_id_seq OWNED BY crm.account.id;


--
-- Name: account_setting; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.account_setting (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    value_string character varying(255) DEFAULT NULL::character varying,
    value_numeric numeric(20,4) DEFAULT NULL::numeric,
    value_boolean integer,
    value_date date,
    value_text text,
    fk_account_id bigint,
    fk_core_entity_id bigint,
    fk_lt_id integer,
    fk_lv_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.account_setting OWNER TO stadmin;

--
-- Name: account_setting_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.account_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.account_setting_id_seq OWNER TO stadmin;

--
-- Name: account_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.account_setting_id_seq OWNED BY crm.account_setting.id;


--
-- Name: campaign; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.campaign (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    name character varying(255) DEFAULT NULL::character varying,
    start_date date,
    end_date date,
    budget numeric(15,2) DEFAULT 0.00 NOT NULL,
    fk_core_entity_id bigint,
    fk_lv_campaign_type bigint,
    fk_lv_campaign_status bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.campaign OWNER TO stadmin;

--
-- Name: campaign_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.campaign_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.campaign_id_seq OWNER TO stadmin;

--
-- Name: campaign_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.campaign_id_seq OWNED BY crm.campaign.id;


--
-- Name: campaign_setting; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.campaign_setting (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    value_string character varying(255) DEFAULT NULL::character varying,
    value_numeric numeric(20,4) DEFAULT NULL::numeric,
    value_boolean integer,
    value_date date,
    value_text text,
    fk_campaign_id bigint,
    fk_core_entity_id bigint,
    fk_lt_id integer,
    fk_lv_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.campaign_setting OWNER TO stadmin;

--
-- Name: campaign_setting_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.campaign_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.campaign_setting_id_seq OWNER TO stadmin;

--
-- Name: campaign_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.campaign_setting_id_seq OWNED BY crm.campaign_setting.id;


--
-- Name: interaction; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.interaction (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    fk_user_id bigint,
    fk_core_entity_id bigint,
    fk_lv_interaction_type bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.interaction OWNER TO stadmin;

--
-- Name: interaction_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.interaction_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.interaction_id_seq OWNER TO stadmin;

--
-- Name: interaction_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.interaction_id_seq OWNED BY crm.interaction.id;


--
-- Name: lead; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.lead (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    first_name character varying(255) DEFAULT NULL::character varying,
    last_name character varying(255) DEFAULT NULL::character varying,
    email character varying(255) DEFAULT NULL::character varying,
    phone character varying(255) DEFAULT NULL::character varying,
    source character varying(100) DEFAULT NULL::character varying,
    converted_to_contact_id bigint,
    fk_core_entity_id bigint,
    fk_lv_lead_status bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.lead OWNER TO stadmin;

--
-- Name: lead_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.lead_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.lead_id_seq OWNER TO stadmin;

--
-- Name: lead_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.lead_id_seq OWNED BY crm.lead.id;


--
-- Name: lookup_type; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.lookup_type (
    id integer NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) DEFAULT NULL::character varying,
    description character varying(500) DEFAULT NULL::character varying,
    comment character varying(1000) DEFAULT NULL::character varying,
    sort integer DEFAULT 100,
    is_many integer DEFAULT 0,
    is_lookup_value integer DEFAULT 1,
    fk_core_entity_id bigint,
    fk_lt_id_parent integer,
    fk_lv_data_type integer DEFAULT 1 NOT NULL,
    fk_lv_input_type integer,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.lookup_type OWNER TO stadmin;

--
-- Name: lookup_type_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.lookup_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.lookup_type_id_seq OWNER TO stadmin;

--
-- Name: lookup_type_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.lookup_type_id_seq OWNED BY crm.lookup_type.id;


--
-- Name: lookup_value; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.lookup_value (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    value_numeric numeric(20,4) DEFAULT NULL::numeric,
    value_string character varying(255) DEFAULT NULL::character varying,
    value_boolean smallint,
    value_date date,
    value_text text,
    sort integer DEFAULT 100,
    description character varying(500) DEFAULT NULL::character varying,
    lookup_valuecol character varying(45) DEFAULT NULL::character varying,
    fk_core_entity_id bigint,
    fk_lt_id integer,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.lookup_value OWNER TO stadmin;

--
-- Name: lookup_value_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.lookup_value_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.lookup_value_id_seq OWNER TO stadmin;

--
-- Name: lookup_value_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.lookup_value_id_seq OWNED BY crm.lookup_value.id;


--
-- Name: note; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.note (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    content text,
    fk_user_id bigint,
    fk_core_entity_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1
);


ALTER TABLE crm.note OWNER TO stadmin;

--
-- Name: note_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.note_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.note_id_seq OWNER TO stadmin;

--
-- Name: note_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.note_id_seq OWNED BY crm.note.id;


--
-- Name: opportunity; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.opportunity (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    name character varying(255) DEFAULT NULL::character varying,
    value numeric(15,2) DEFAULT 0.00 NOT NULL,
    probability numeric(5,2) DEFAULT 0.00 NOT NULL,
    close_date date,
    fk_core_entity_id bigint,
    fk_lv_opportunity_stage bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.opportunity OWNER TO stadmin;

--
-- Name: opportunity_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.opportunity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.opportunity_id_seq OWNER TO stadmin;

--
-- Name: opportunity_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.opportunity_id_seq OWNED BY crm.opportunity.id;


--
-- Name: tag; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.tag (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    name character varying(100) DEFAULT NULL::character varying,
    fk_core_entity_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.tag OWNER TO stadmin;

--
-- Name: tag_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.tag_id_seq OWNER TO stadmin;

--
-- Name: tag_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.tag_id_seq OWNED BY crm.tag.id;


--
-- Name: tagging; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.tagging (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    entity_type character varying(50) NOT NULL,
    fk_tag_id bigint NOT NULL,
    fk_entity_id bigint NOT NULL,
    fk_core_entity_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.tagging OWNER TO stadmin;

--
-- Name: tagging_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.tagging_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.tagging_id_seq OWNER TO stadmin;

--
-- Name: tagging_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.tagging_id_seq OWNED BY crm.tagging.id;


--
-- Name: task; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.task (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    description text,
    due_date timestamp without time zone,
    fk_user_id bigint,
    fk_core_entity_id bigint,
    fk_lv_task_status bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.task OWNER TO stadmin;

--
-- Name: task_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.task_id_seq OWNER TO stadmin;

--
-- Name: task_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.task_id_seq OWNED BY crm.task.id;


--
-- Name: user; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm."user" (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    screen_name character varying(55) DEFAULT NULL::character varying,
    email character varying(255) DEFAULT NULL::character varying,
    first_name character varying(255) DEFAULT NULL::character varying,
    last_name character varying(255) DEFAULT NULL::character varying,
    password character varying(255) DEFAULT NULL::character varying,
    phone_number character varying(255) DEFAULT NULL::character varying,
    address character varying(500) DEFAULT NULL::character varying,
    city character varying(25) DEFAULT NULL::character varying,
    zipcode character varying(45) DEFAULT NULL::character varying,
    profile_image character varying(255) DEFAULT NULL::character varying,
    last_login_date timestamp without time zone,
    fk_core_entity_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1
);


ALTER TABLE crm."user" OWNER TO stadmin;

--
-- Name: user_data; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.user_data (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    data_value character varying(255) DEFAULT NULL::character varying,
    data_value_large character varying(1500) DEFAULT NULL::character varying,
    fk_user_data_type_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.user_data OWNER TO stadmin;

--
-- Name: user_data_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.user_data_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.user_data_id_seq OWNER TO stadmin;

--
-- Name: user_data_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.user_data_id_seq OWNED BY crm.user_data.id;


--
-- Name: user_data_type; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.user_data_type (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    data_type character varying(100) DEFAULT NULL::character varying,
    description character varying(1200) DEFAULT NULL::character varying,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.user_data_type OWNER TO stadmin;

--
-- Name: user_data_type_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.user_data_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.user_data_type_id_seq OWNER TO stadmin;

--
-- Name: user_data_type_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.user_data_type_id_seq OWNED BY crm.user_data_type.id;


--
-- Name: user_group; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.user_group (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    name character varying(255) DEFAULT NULL::character varying,
    title character varying(500) DEFAULT NULL::character varying,
    description character varying(2000) DEFAULT NULL::character varying,
    fk_core_entity_id bigint,
    fk_lv_user_group_type integer,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.user_group OWNER TO stadmin;

--
-- Name: user_group_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.user_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.user_group_id_seq OWNER TO stadmin;

--
-- Name: user_group_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.user_group_id_seq OWNED BY crm.user_group.id;


--
-- Name: user_group_setting; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.user_group_setting (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    value_string character varying(255) DEFAULT NULL::character varying,
    value_numeric numeric(20,4) DEFAULT NULL::numeric,
    value_boolean integer,
    value_date date,
    value_text text,
    fk_user_group_id bigint,
    fk_core_entity_id bigint,
    fk_lt_id integer,
    fk_lv_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.user_group_setting OWNER TO stadmin;

--
-- Name: user_group_setting_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.user_group_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.user_group_setting_id_seq OWNER TO stadmin;

--
-- Name: user_group_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.user_group_setting_id_seq OWNED BY crm.user_group_setting.id;


--
-- Name: user_group_user; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.user_group_user (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    fk_user_id bigint,
    fk_user_group_id bigint,
    fk_core_entity_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.user_group_user OWNER TO stadmin;

--
-- Name: user_group_user_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.user_group_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.user_group_user_id_seq OWNER TO stadmin;

--
-- Name: user_group_user_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.user_group_user_id_seq OWNED BY crm.user_group_user.id;


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.user_id_seq OWNER TO stadmin;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.user_id_seq OWNED BY crm."user".id;


--
-- Name: user_setting; Type: TABLE; Schema: crm; Owner: stadmin
--

CREATE TABLE crm.user_setting (
    id bigint NOT NULL,
    uuid character varying(36) DEFAULT core.uuid_generate_v4() NOT NULL,
    value_string character varying(255) DEFAULT NULL::character varying,
    value_numeric numeric(20,4) DEFAULT NULL::numeric,
    value_boolean integer,
    value_date date,
    value_text text,
    fk_user_id bigint,
    fk_core_entity_id bigint,
    fk_lt_id integer,
    fk_lv_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id_updated bigint DEFAULT 1 NOT NULL
);


ALTER TABLE crm.user_setting OWNER TO stadmin;

--
-- Name: user_setting_id_seq; Type: SEQUENCE; Schema: crm; Owner: stadmin
--

CREATE SEQUENCE crm.user_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.user_setting_id_seq OWNER TO stadmin;

--
-- Name: user_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: stadmin
--

ALTER SEQUENCE crm.user_setting_id_seq OWNED BY crm.user_setting.id;


--
-- Name: ai_rules id; Type: DEFAULT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.ai_rules ALTER COLUMN id SET DEFAULT nextval('comms.ai_rules_id_seq'::regclass);


--
-- Name: consent_keyword id; Type: DEFAULT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.consent_keyword ALTER COLUMN id SET DEFAULT nextval('comms.consent_keyword_id_seq'::regclass);


--
-- Name: contact_us id; Type: DEFAULT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.contact_us ALTER COLUMN id SET DEFAULT nextval('comms.contact_us_id_seq'::regclass);


--
-- Name: property id; Type: DEFAULT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.property ALTER COLUMN id SET DEFAULT nextval('comms.property_id_seq'::regclass);


--
-- Name: property_consent_text id; Type: DEFAULT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.property_consent_text ALTER COLUMN id SET DEFAULT nextval('comms.property_consent_text_id_seq'::regclass);


--
-- Name: property_phone id; Type: DEFAULT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.property_phone ALTER COLUMN id SET DEFAULT nextval('comms.property_phone_id_seq'::regclass);


--
-- Name: scrape_rules id; Type: DEFAULT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.scrape_rules ALTER COLUMN id SET DEFAULT nextval('comms.scrape_rules_id_seq'::regclass);


--
-- Name: scraped_data id; Type: DEFAULT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.scraped_data ALTER COLUMN id SET DEFAULT nextval('comms.scraped_data_id_seq'::regclass);


--
-- Name: scraped_data_frequent id; Type: DEFAULT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.scraped_data_frequent ALTER COLUMN id SET DEFAULT nextval('comms.scraped_data_frequent_id_seq'::regclass);


--
-- Name: scraped_data_infrequent id; Type: DEFAULT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.scraped_data_infrequent ALTER COLUMN id SET DEFAULT nextval('comms.scraped_data_infrequent_id_seq'::regclass);


--
-- Name: stock_text id; Type: DEFAULT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.stock_text ALTER COLUMN id SET DEFAULT nextval('comms.stock_text_id_seq'::regclass);


--
-- Name: support_requests id; Type: DEFAULT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.support_requests ALTER COLUMN id SET DEFAULT nextval('comms.support_requests_id_seq'::regclass);


--
-- Name: transcript id; Type: DEFAULT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.transcript ALTER COLUMN id SET DEFAULT nextval('comms.transcripts_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms."user" ALTER COLUMN id SET DEFAULT nextval('comms.user_id_seq'::regclass);


--
-- Name: user_activity id; Type: DEFAULT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_activity ALTER COLUMN id SET DEFAULT nextval('comms.user_activity_id_seq'::regclass);


--
-- Name: user_activity_item id; Type: DEFAULT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_activity_item ALTER COLUMN id SET DEFAULT nextval('comms.user_activity_item_id_seq'::regclass);


--
-- Name: user_consent id; Type: DEFAULT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.user_consent ALTER COLUMN id SET DEFAULT nextval('comms.user_consent_id_seq'::regclass);


--
-- Name: user_email id; Type: DEFAULT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_email ALTER COLUMN id SET DEFAULT nextval('comms.user_email_id_seq'::regclass);


--
-- Name: user_phone id; Type: DEFAULT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_phone ALTER COLUMN id SET DEFAULT nextval('comms.user_phone_id_seq'::regclass);


--
-- Name: country id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.country ALTER COLUMN id SET DEFAULT nextval('core.country_id_seq'::regclass);


--
-- Name: entity id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity ALTER COLUMN id SET DEFAULT nextval('core.entity_id_seq'::regclass);


--
-- Name: entity_service id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity_service ALTER COLUMN id SET DEFAULT nextval('core.entity_service_id_seq'::regclass);


--
-- Name: entity_setting id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity_setting ALTER COLUMN id SET DEFAULT nextval('core.entity_setting_id_seq'::regclass);


--
-- Name: log_error id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.log_error ALTER COLUMN id SET DEFAULT nextval('core.log_error_id_seq'::regclass);


--
-- Name: lookup_type id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_type ALTER COLUMN id SET DEFAULT nextval('core.lookup_type_id_seq'::regclass);


--
-- Name: lookup_value id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_value ALTER COLUMN id SET DEFAULT nextval('core.lookup_value_id_seq'::regclass);


--
-- Name: state id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.state ALTER COLUMN id SET DEFAULT nextval('core.state_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core."user" ALTER COLUMN id SET DEFAULT nextval('core.user_id_seq'::regclass);


--
-- Name: user_group id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group ALTER COLUMN id SET DEFAULT nextval('core.user_group_id_seq'::regclass);


--
-- Name: user_group_setting id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_setting ALTER COLUMN id SET DEFAULT nextval('core.user_group_setting_id_seq'::regclass);


--
-- Name: user_group_user id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_user ALTER COLUMN id SET DEFAULT nextval('core.user_group_user_id_seq'::regclass);


--
-- Name: user_setting id; Type: DEFAULT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_setting ALTER COLUMN id SET DEFAULT nextval('core.user_setting_id_seq'::regclass);


--
-- Name: account id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account ALTER COLUMN id SET DEFAULT nextval('crm.account_id_seq'::regclass);


--
-- Name: account_setting id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account_setting ALTER COLUMN id SET DEFAULT nextval('crm.account_setting_id_seq'::regclass);


--
-- Name: campaign id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign ALTER COLUMN id SET DEFAULT nextval('crm.campaign_id_seq'::regclass);


--
-- Name: campaign_setting id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign_setting ALTER COLUMN id SET DEFAULT nextval('crm.campaign_setting_id_seq'::regclass);


--
-- Name: interaction id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.interaction ALTER COLUMN id SET DEFAULT nextval('crm.interaction_id_seq'::regclass);


--
-- Name: lead id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lead ALTER COLUMN id SET DEFAULT nextval('crm.lead_id_seq'::regclass);


--
-- Name: lookup_type id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_type ALTER COLUMN id SET DEFAULT nextval('crm.lookup_type_id_seq'::regclass);


--
-- Name: lookup_value id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_value ALTER COLUMN id SET DEFAULT nextval('crm.lookup_value_id_seq'::regclass);


--
-- Name: note id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.note ALTER COLUMN id SET DEFAULT nextval('crm.note_id_seq'::regclass);


--
-- Name: opportunity id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.opportunity ALTER COLUMN id SET DEFAULT nextval('crm.opportunity_id_seq'::regclass);


--
-- Name: tag id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.tag ALTER COLUMN id SET DEFAULT nextval('crm.tag_id_seq'::regclass);


--
-- Name: tagging id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.tagging ALTER COLUMN id SET DEFAULT nextval('crm.tagging_id_seq'::regclass);


--
-- Name: task id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.task ALTER COLUMN id SET DEFAULT nextval('crm.task_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm."user" ALTER COLUMN id SET DEFAULT nextval('crm.user_id_seq'::regclass);


--
-- Name: user_data id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_data ALTER COLUMN id SET DEFAULT nextval('crm.user_data_id_seq'::regclass);


--
-- Name: user_data_type id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_data_type ALTER COLUMN id SET DEFAULT nextval('crm.user_data_type_id_seq'::regclass);


--
-- Name: user_group id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group ALTER COLUMN id SET DEFAULT nextval('crm.user_group_id_seq'::regclass);


--
-- Name: user_group_setting id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_setting ALTER COLUMN id SET DEFAULT nextval('crm.user_group_setting_id_seq'::regclass);


--
-- Name: user_group_user id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_user ALTER COLUMN id SET DEFAULT nextval('crm.user_group_user_id_seq'::regclass);


--
-- Name: user_setting id; Type: DEFAULT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_setting ALTER COLUMN id SET DEFAULT nextval('crm.user_setting_id_seq'::regclass);


--
-- Name: ai_rules ai_rules_pkey; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.ai_rules
    ADD CONSTRAINT ai_rules_pkey PRIMARY KEY (id);


--
-- Name: ai_rules ai_rules_uuid_unique; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.ai_rules
    ADD CONSTRAINT ai_rules_uuid_unique UNIQUE (uuid);


--
-- Name: user comms_user_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms."user"
    ADD CONSTRAINT comms_user_pkey PRIMARY KEY (id);


--
-- Name: user comms_user_uuid_unique; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms."user"
    ADD CONSTRAINT comms_user_uuid_unique UNIQUE (uuid);


--
-- Name: consent_keyword consent_keyword_keyword_key; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.consent_keyword
    ADD CONSTRAINT consent_keyword_keyword_key UNIQUE (keyword);


--
-- Name: consent_keyword consent_keyword_pkey; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.consent_keyword
    ADD CONSTRAINT consent_keyword_pkey PRIMARY KEY (id);


--
-- Name: contact_us contact_us_pkey; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.contact_us
    ADD CONSTRAINT contact_us_pkey PRIMARY KEY (id);


--
-- Name: property_consent_text property_consent_text_pkey; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.property_consent_text
    ADD CONSTRAINT property_consent_text_pkey PRIMARY KEY (id);


--
-- Name: property_phone property_phone_pkey; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.property_phone
    ADD CONSTRAINT property_phone_pkey PRIMARY KEY (id);


--
-- Name: property property_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.property
    ADD CONSTRAINT property_pkey PRIMARY KEY (id);


--
-- Name: property property_uuid_unique; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.property
    ADD CONSTRAINT property_uuid_unique UNIQUE (uuid);


--
-- Name: scrape_rules scrape_rules_pkey; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.scrape_rules
    ADD CONSTRAINT scrape_rules_pkey PRIMARY KEY (id);


--
-- Name: scraped_data_frequent scraped_data_frequent_pkey; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.scraped_data_frequent
    ADD CONSTRAINT scraped_data_frequent_pkey PRIMARY KEY (id);


--
-- Name: scraped_data_frequent_temp scraped_data_frequent_temp_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.scraped_data_frequent_temp
    ADD CONSTRAINT scraped_data_frequent_temp_pkey PRIMARY KEY (id);


--
-- Name: scraped_data_infrequent scraped_data_infrequent_pkey; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.scraped_data_infrequent
    ADD CONSTRAINT scraped_data_infrequent_pkey PRIMARY KEY (id);


--
-- Name: scraped_data_infrequent_temp scraped_data_infrequent_temp_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.scraped_data_infrequent_temp
    ADD CONSTRAINT scraped_data_infrequent_temp_pkey PRIMARY KEY (id);


--
-- Name: scraped_data scraped_data_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.scraped_data
    ADD CONSTRAINT scraped_data_pkey PRIMARY KEY (id);


--
-- Name: scraped_data scraped_data_uuid_unique; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.scraped_data
    ADD CONSTRAINT scraped_data_uuid_unique UNIQUE (uuid);


--
-- Name: stock_text stock_text_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.stock_text
    ADD CONSTRAINT stock_text_pkey PRIMARY KEY (id);


--
-- Name: stock_text stock_text_uuid_unique; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.stock_text
    ADD CONSTRAINT stock_text_uuid_unique UNIQUE (uuid);


--
-- Name: support_requests support_requests_pkey; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.support_requests
    ADD CONSTRAINT support_requests_pkey PRIMARY KEY (id);


--
-- Name: transcript transcripts_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.transcript
    ADD CONSTRAINT transcripts_pkey PRIMARY KEY (id);


--
-- Name: scraped_data unique_fk_property_id; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.scraped_data
    ADD CONSTRAINT unique_fk_property_id UNIQUE (fk_property_id);


--
-- Name: user_activity_item user_activity_item_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_activity_item
    ADD CONSTRAINT user_activity_item_pkey PRIMARY KEY (id);


--
-- Name: user_activity_item user_activity_item_uuid_unique; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_activity_item
    ADD CONSTRAINT user_activity_item_uuid_unique UNIQUE (uuid);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (id);


--
-- Name: user_activity user_activity_uuid_unique; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_activity
    ADD CONSTRAINT user_activity_uuid_unique UNIQUE (uuid);


--
-- Name: user_consent user_consent_pkey; Type: CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.user_consent
    ADD CONSTRAINT user_consent_pkey PRIMARY KEY (id);


--
-- Name: user_email user_email_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_email
    ADD CONSTRAINT user_email_pkey PRIMARY KEY (id);


--
-- Name: user_email user_email_unique; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_email
    ADD CONSTRAINT user_email_unique UNIQUE (email);


--
-- Name: user_email user_email_uuid_unique; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_email
    ADD CONSTRAINT user_email_uuid_unique UNIQUE (uuid);


--
-- Name: user_phone user_phone_number_unique; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_phone
    ADD CONSTRAINT user_phone_number_unique UNIQUE (phone_number);


--
-- Name: user_phone user_phone_pkey; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_phone
    ADD CONSTRAINT user_phone_pkey PRIMARY KEY (id);


--
-- Name: user_phone user_phone_uuid_unique; Type: CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_phone
    ADD CONSTRAINT user_phone_uuid_unique UNIQUE (uuid);


--
-- Name: country core_country_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.country
    ADD CONSTRAINT core_country_pkey PRIMARY KEY (id);


--
-- Name: country core_country_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.country
    ADD CONSTRAINT core_country_uuid_unique UNIQUE (uuid);


--
-- Name: entity core_entity_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity
    ADD CONSTRAINT core_entity_pkey PRIMARY KEY (id);


--
-- Name: entity_service core_entity_service_setting_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity_service
    ADD CONSTRAINT core_entity_service_setting_pkey PRIMARY KEY (id);


--
-- Name: entity_service core_entity_service_setting_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity_service
    ADD CONSTRAINT core_entity_service_setting_uuid_unique UNIQUE (uuid);


--
-- Name: entity_setting core_entity_setting_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity_setting
    ADD CONSTRAINT core_entity_setting_pkey PRIMARY KEY (id);


--
-- Name: entity_setting core_entity_setting_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity_setting
    ADD CONSTRAINT core_entity_setting_uuid_unique UNIQUE (uuid);


--
-- Name: entity core_entity_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity
    ADD CONSTRAINT core_entity_uuid_unique UNIQUE (uuid);


--
-- Name: log_error core_log_error_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.log_error
    ADD CONSTRAINT core_log_error_pkey PRIMARY KEY (id);


--
-- Name: log_error core_log_error_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.log_error
    ADD CONSTRAINT core_log_error_uuid_unique UNIQUE (uuid);


--
-- Name: lookup_type core_lookup_type_name_parent_id_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_type
    ADD CONSTRAINT core_lookup_type_name_parent_id_unique UNIQUE (name, fk_lt_id_parent);


--
-- Name: lookup_type core_lookup_type_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_type
    ADD CONSTRAINT core_lookup_type_pkey PRIMARY KEY (id);


--
-- Name: lookup_type core_lookup_type_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_type
    ADD CONSTRAINT core_lookup_type_uuid_unique UNIQUE (uuid);


--
-- Name: lookup_value core_lookup_value_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_value
    ADD CONSTRAINT core_lookup_value_pkey PRIMARY KEY (id);


--
-- Name: lookup_value core_lookup_value_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_value
    ADD CONSTRAINT core_lookup_value_uuid_unique UNIQUE (uuid);


--
-- Name: state core_state_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.state
    ADD CONSTRAINT core_state_pkey PRIMARY KEY (id);


--
-- Name: state core_state_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.state
    ADD CONSTRAINT core_state_uuid_unique UNIQUE (uuid);


--
-- Name: user_group core_user_group_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group
    ADD CONSTRAINT core_user_group_pkey PRIMARY KEY (id);


--
-- Name: user_group_setting core_user_group_setting_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_setting
    ADD CONSTRAINT core_user_group_setting_pkey PRIMARY KEY (id);


--
-- Name: user_group_setting core_user_group_setting_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_setting
    ADD CONSTRAINT core_user_group_setting_uuid_unique UNIQUE (uuid);


--
-- Name: user_group_user core_user_group_user_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_user
    ADD CONSTRAINT core_user_group_user_pkey PRIMARY KEY (id);


--
-- Name: user_group_user core_user_group_user_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_user
    ADD CONSTRAINT core_user_group_user_uuid_unique UNIQUE (uuid);


--
-- Name: user_group core_user_group_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group
    ADD CONSTRAINT core_user_group_uuid_unique UNIQUE (uuid);


--
-- Name: user core_user_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core."user"
    ADD CONSTRAINT core_user_pkey PRIMARY KEY (id);


--
-- Name: user_setting core_user_setting_pkey; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_setting
    ADD CONSTRAINT core_user_setting_pkey PRIMARY KEY (id);


--
-- Name: user_setting core_user_setting_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_setting
    ADD CONSTRAINT core_user_setting_uuid_unique UNIQUE (uuid);


--
-- Name: user core_user_uuid_unique; Type: CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core."user"
    ADD CONSTRAINT core_user_uuid_unique UNIQUE (uuid);


--
-- Name: account crm_account_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account
    ADD CONSTRAINT crm_account_pkey PRIMARY KEY (id);


--
-- Name: account_setting crm_account_setting_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account_setting
    ADD CONSTRAINT crm_account_setting_pkey PRIMARY KEY (id);


--
-- Name: account_setting crm_account_setting_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account_setting
    ADD CONSTRAINT crm_account_setting_uuid_unique UNIQUE (uuid);


--
-- Name: account crm_account_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account
    ADD CONSTRAINT crm_account_uuid_unique UNIQUE (uuid);


--
-- Name: campaign crm_campaign_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign
    ADD CONSTRAINT crm_campaign_pkey PRIMARY KEY (id);


--
-- Name: campaign_setting crm_campaign_setting_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign_setting
    ADD CONSTRAINT crm_campaign_setting_pkey PRIMARY KEY (id);


--
-- Name: campaign_setting crm_campaign_setting_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign_setting
    ADD CONSTRAINT crm_campaign_setting_uuid_unique UNIQUE (uuid);


--
-- Name: campaign crm_campaign_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign
    ADD CONSTRAINT crm_campaign_uuid_unique UNIQUE (uuid);


--
-- Name: interaction crm_interaction_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.interaction
    ADD CONSTRAINT crm_interaction_pkey PRIMARY KEY (id);


--
-- Name: interaction crm_interaction_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.interaction
    ADD CONSTRAINT crm_interaction_uuid_unique UNIQUE (uuid);


--
-- Name: lead crm_lead_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lead
    ADD CONSTRAINT crm_lead_pkey PRIMARY KEY (id);


--
-- Name: lead crm_lead_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lead
    ADD CONSTRAINT crm_lead_uuid_unique UNIQUE (uuid);


--
-- Name: lookup_type crm_lookup_type_name_parent_id_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_type
    ADD CONSTRAINT crm_lookup_type_name_parent_id_unique UNIQUE (name, fk_lt_id_parent);


--
-- Name: lookup_type crm_lookup_type_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_type
    ADD CONSTRAINT crm_lookup_type_pkey PRIMARY KEY (id);


--
-- Name: lookup_type crm_lookup_type_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_type
    ADD CONSTRAINT crm_lookup_type_uuid_unique UNIQUE (uuid);


--
-- Name: lookup_value crm_lookup_value_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_value
    ADD CONSTRAINT crm_lookup_value_pkey PRIMARY KEY (id);


--
-- Name: lookup_value crm_lookup_value_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_value
    ADD CONSTRAINT crm_lookup_value_uuid_unique UNIQUE (uuid);


--
-- Name: note crm_note_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.note
    ADD CONSTRAINT crm_note_pkey PRIMARY KEY (id);


--
-- Name: note crm_note_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.note
    ADD CONSTRAINT crm_note_uuid_unique UNIQUE (uuid);


--
-- Name: opportunity crm_opportunity_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.opportunity
    ADD CONSTRAINT crm_opportunity_pkey PRIMARY KEY (id);


--
-- Name: opportunity crm_opportunity_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.opportunity
    ADD CONSTRAINT crm_opportunity_uuid_unique UNIQUE (uuid);


--
-- Name: tag crm_tag_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.tag
    ADD CONSTRAINT crm_tag_pkey PRIMARY KEY (id);


--
-- Name: tag crm_tag_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.tag
    ADD CONSTRAINT crm_tag_uuid_unique UNIQUE (uuid);


--
-- Name: tagging crm_tagging_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.tagging
    ADD CONSTRAINT crm_tagging_pkey PRIMARY KEY (id);


--
-- Name: tagging crm_tagging_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.tagging
    ADD CONSTRAINT crm_tagging_uuid_unique UNIQUE (uuid);


--
-- Name: task crm_task_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.task
    ADD CONSTRAINT crm_task_pkey PRIMARY KEY (id);


--
-- Name: task crm_task_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.task
    ADD CONSTRAINT crm_task_uuid_unique UNIQUE (uuid);


--
-- Name: user_data crm_user_data_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_data
    ADD CONSTRAINT crm_user_data_pkey PRIMARY KEY (id);


--
-- Name: user_data_type crm_user_data_type_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_data_type
    ADD CONSTRAINT crm_user_data_type_pkey PRIMARY KEY (id);


--
-- Name: user_data_type crm_user_data_type_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_data_type
    ADD CONSTRAINT crm_user_data_type_uuid_unique UNIQUE (uuid);


--
-- Name: user_data crm_user_data_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_data
    ADD CONSTRAINT crm_user_data_uuid_unique UNIQUE (uuid);


--
-- Name: user_group crm_user_group_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group
    ADD CONSTRAINT crm_user_group_pkey PRIMARY KEY (id);


--
-- Name: user_group_setting crm_user_group_setting_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_setting
    ADD CONSTRAINT crm_user_group_setting_pkey PRIMARY KEY (id);


--
-- Name: user_group_setting crm_user_group_setting_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_setting
    ADD CONSTRAINT crm_user_group_setting_uuid_unique UNIQUE (uuid);


--
-- Name: user_group_user crm_user_group_user_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_user
    ADD CONSTRAINT crm_user_group_user_pkey PRIMARY KEY (id);


--
-- Name: user_group_user crm_user_group_user_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_user
    ADD CONSTRAINT crm_user_group_user_uuid_unique UNIQUE (uuid);


--
-- Name: user_group crm_user_group_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group
    ADD CONSTRAINT crm_user_group_uuid_unique UNIQUE (uuid);


--
-- Name: user crm_user_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm."user"
    ADD CONSTRAINT crm_user_pkey PRIMARY KEY (id);


--
-- Name: user_setting crm_user_setting_pkey; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_setting
    ADD CONSTRAINT crm_user_setting_pkey PRIMARY KEY (id);


--
-- Name: user_setting crm_user_setting_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_setting
    ADD CONSTRAINT crm_user_setting_uuid_unique UNIQUE (uuid);


--
-- Name: user crm_user_uuid_unique; Type: CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm."user"
    ADD CONSTRAINT crm_user_uuid_unique UNIQUE (uuid);


--
-- Name: idx_scraped_data_frequent_property; Type: INDEX; Schema: comms; Owner: jamieson
--

CREATE INDEX idx_scraped_data_frequent_property ON comms.scraped_data_frequent USING btree (fk_property_id, create_date);


--
-- Name: idx_scraped_data_infrequent_property; Type: INDEX; Schema: comms; Owner: jamieson
--

CREATE INDEX idx_scraped_data_infrequent_property ON comms.scraped_data_infrequent USING btree (fk_property_id, create_date);


--
-- Name: scraped_data_frequent_temp_fk_property_id_create_date_idx; Type: INDEX; Schema: comms; Owner: stadmin
--

CREATE INDEX scraped_data_frequent_temp_fk_property_id_create_date_idx ON comms.scraped_data_frequent_temp USING btree (fk_property_id, create_date);


--
-- Name: scraped_data_infrequent_temp_fk_property_id_create_date_idx; Type: INDEX; Schema: comms; Owner: stadmin
--

CREATE INDEX scraped_data_infrequent_temp_fk_property_id_create_date_idx ON comms.scraped_data_infrequent_temp USING btree (fk_property_id, create_date);


--
-- Name: ai_rules ai_rules_property_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.ai_rules
    ADD CONSTRAINT ai_rules_property_fkey FOREIGN KEY (fk_property_id) REFERENCES comms.property(id);


--
-- Name: transcript fk_user_email_id; Type: FK CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.transcript
    ADD CONSTRAINT fk_user_email_id FOREIGN KEY (fk_user_email_id) REFERENCES comms.user_email(id);


--
-- Name: transcript fk_user_phone_id; Type: FK CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.transcript
    ADD CONSTRAINT fk_user_phone_id FOREIGN KEY (fk_user_phone_id) REFERENCES comms.user_phone(id);


--
-- Name: property_consent_text property_consent_text_fk_property_id_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.property_consent_text
    ADD CONSTRAINT property_consent_text_fk_property_id_fkey FOREIGN KEY (fk_property_id) REFERENCES comms.property(id);


--
-- Name: property_phone property_phone_fk_property_id_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.property_phone
    ADD CONSTRAINT property_phone_fk_property_id_fkey FOREIGN KEY (fk_property_id) REFERENCES comms.property(id);


--
-- Name: scrape_rules scrape_rules_fk_property_id_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.scrape_rules
    ADD CONSTRAINT scrape_rules_fk_property_id_fkey FOREIGN KEY (fk_property_id) REFERENCES comms.property(id);


--
-- Name: scraped_data_frequent scraped_data_frequent_fk_property_id_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.scraped_data_frequent
    ADD CONSTRAINT scraped_data_frequent_fk_property_id_fkey FOREIGN KEY (fk_property_id) REFERENCES comms.property(id);


--
-- Name: scraped_data_infrequent scraped_data_infrequent_fk_property_id_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.scraped_data_infrequent
    ADD CONSTRAINT scraped_data_infrequent_fk_property_id_fkey FOREIGN KEY (fk_property_id) REFERENCES comms.property(id);


--
-- Name: scraped_data scraped_data_property_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.scraped_data
    ADD CONSTRAINT scraped_data_property_fkey FOREIGN KEY (fk_property_id) REFERENCES comms.property(id);


--
-- Name: stock_text stock_text_property_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.stock_text
    ADD CONSTRAINT stock_text_property_fkey FOREIGN KEY (fk_property_id) REFERENCES comms.property(id);


--
-- Name: user_activity user_activity_email_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_activity
    ADD CONSTRAINT user_activity_email_fkey FOREIGN KEY (fk_user_email_id) REFERENCES comms.user_email(id);


--
-- Name: user_activity_item user_activity_item_activity_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_activity_item
    ADD CONSTRAINT user_activity_item_activity_fkey FOREIGN KEY (fk_user_activity_id) REFERENCES comms.user_activity(id);


--
-- Name: user_activity user_activity_phone_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_activity
    ADD CONSTRAINT user_activity_phone_fkey FOREIGN KEY (fk_user_phone_id) REFERENCES comms.user_phone(id);


--
-- Name: user_activity user_activity_user_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_activity
    ADD CONSTRAINT user_activity_user_fkey FOREIGN KEY (fk_user_id) REFERENCES comms."user"(id);


--
-- Name: user_consent user_consent_fk_property_phone_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.user_consent
    ADD CONSTRAINT user_consent_fk_property_phone_fkey FOREIGN KEY (fk_property_phone) REFERENCES comms.property_phone(id) ON DELETE SET NULL;


--
-- Name: user_consent user_consent_fk_user_id_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: jamieson
--

ALTER TABLE ONLY comms.user_consent
    ADD CONSTRAINT user_consent_fk_user_id_fkey FOREIGN KEY (fk_user_id) REFERENCES comms."user"(id);


--
-- Name: user_email user_email_user_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_email
    ADD CONSTRAINT user_email_user_fkey FOREIGN KEY (fk_user_id) REFERENCES comms."user"(id);


--
-- Name: user_phone user_phone_user_fkey; Type: FK CONSTRAINT; Schema: comms; Owner: stadmin
--

ALTER TABLE ONLY comms.user_phone
    ADD CONSTRAINT user_phone_user_fkey FOREIGN KEY (fk_user_id) REFERENCES comms."user"(id);


--
-- Name: entity core_entity_fk_entity_id_parent_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity
    ADD CONSTRAINT core_entity_fk_entity_id_parent_fkey FOREIGN KEY (fk_entity_id_parent) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: entity core_entity_fk_lv_entity_type_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity
    ADD CONSTRAINT core_entity_fk_lv_entity_type_fkey FOREIGN KEY (fk_lv_entity_type) REFERENCES core.lookup_value(id) ON DELETE SET NULL;


--
-- Name: entity_service core_entity_service_fk_lv_id_service_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity_service
    ADD CONSTRAINT core_entity_service_fk_lv_id_service_fkey FOREIGN KEY (fk_lv_id_service) REFERENCES core.lookup_value(id) ON DELETE SET NULL;


--
-- Name: entity_setting core_entity_setting_fk_entity_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity_setting
    ADD CONSTRAINT core_entity_setting_fk_entity_id_fkey FOREIGN KEY (fk_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: entity_setting core_entity_setting_fk_lt_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity_setting
    ADD CONSTRAINT core_entity_setting_fk_lt_id_fkey FOREIGN KEY (fk_lt_id) REFERENCES core.lookup_type(id) ON DELETE SET NULL;


--
-- Name: entity_setting core_entity_setting_fk_lv_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.entity_setting
    ADD CONSTRAINT core_entity_setting_fk_lv_id_fkey FOREIGN KEY (fk_lv_id) REFERENCES core.lookup_value(id) ON DELETE SET NULL;


--
-- Name: log_error core_log_error_fk_lv_log_error_type_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.log_error
    ADD CONSTRAINT core_log_error_fk_lv_log_error_type_fkey FOREIGN KEY (fk_lv_log_error_type) REFERENCES core.lookup_value(id) ON DELETE SET NULL;


--
-- Name: lookup_type core_lookup_type_fk_lt_id_parent_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_type
    ADD CONSTRAINT core_lookup_type_fk_lt_id_parent_fkey FOREIGN KEY (fk_lt_id_parent) REFERENCES core.lookup_type(id) ON DELETE SET NULL;


--
-- Name: lookup_type core_lookup_type_fk_lv_data_type_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_type
    ADD CONSTRAINT core_lookup_type_fk_lv_data_type_fkey FOREIGN KEY (fk_lv_data_type) REFERENCES core.lookup_value(id) ON DELETE SET NULL;


--
-- Name: lookup_type core_lookup_type_fk_lv_input_type_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_type
    ADD CONSTRAINT core_lookup_type_fk_lv_input_type_fkey FOREIGN KEY (fk_lv_input_type) REFERENCES core.lookup_value(id) ON DELETE SET NULL;


--
-- Name: lookup_value core_lookup_value_fk_lt_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.lookup_value
    ADD CONSTRAINT core_lookup_value_fk_lt_id_fkey FOREIGN KEY (fk_lt_id) REFERENCES core.lookup_type(id) ON DELETE SET NULL;


--
-- Name: state core_state_fk_country_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.state
    ADD CONSTRAINT core_state_fk_country_id_fkey FOREIGN KEY (fk_country_id) REFERENCES core.country(id) ON DELETE SET NULL;


--
-- Name: user core_user_fk_country_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core."user"
    ADD CONSTRAINT core_user_fk_country_id_fkey FOREIGN KEY (fk_country_id) REFERENCES core.country(id) ON DELETE SET NULL;


--
-- Name: user core_user_fk_lv_user_type_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core."user"
    ADD CONSTRAINT core_user_fk_lv_user_type_fkey FOREIGN KEY (fk_lv_user_type) REFERENCES core.lookup_value(id) ON DELETE SET NULL;


--
-- Name: user core_user_fk_state_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core."user"
    ADD CONSTRAINT core_user_fk_state_id_fkey FOREIGN KEY (fk_state_id) REFERENCES core.state(id) ON DELETE SET NULL;


--
-- Name: user_group core_user_group_fk_lv_user_group_type_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group
    ADD CONSTRAINT core_user_group_fk_lv_user_group_type_fkey FOREIGN KEY (fk_lv_user_group_type) REFERENCES core.lookup_value(id) ON DELETE SET NULL;


--
-- Name: user_group_setting core_user_group_setting_fk_lt_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_setting
    ADD CONSTRAINT core_user_group_setting_fk_lt_id_fkey FOREIGN KEY (fk_lt_id) REFERENCES core.lookup_type(id) ON DELETE SET NULL;


--
-- Name: user_group_setting core_user_group_setting_fk_lv_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_setting
    ADD CONSTRAINT core_user_group_setting_fk_lv_id_fkey FOREIGN KEY (fk_lv_id) REFERENCES core.lookup_value(id) ON DELETE SET NULL;


--
-- Name: user_group_setting core_user_group_setting_fk_user_group_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_setting
    ADD CONSTRAINT core_user_group_setting_fk_user_group_id_fkey FOREIGN KEY (fk_user_group_id) REFERENCES core.user_group(id) ON DELETE SET NULL;


--
-- Name: user_group_user core_user_group_user_fk_user_group_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_user
    ADD CONSTRAINT core_user_group_user_fk_user_group_id_fkey FOREIGN KEY (fk_user_group_id) REFERENCES core.user_group(id) ON DELETE SET NULL;


--
-- Name: user_group_user core_user_group_user_fk_user_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_group_user
    ADD CONSTRAINT core_user_group_user_fk_user_id_fkey FOREIGN KEY (fk_user_id) REFERENCES core."user"(id) ON DELETE SET NULL;


--
-- Name: user_setting core_user_setting_fk_lt_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_setting
    ADD CONSTRAINT core_user_setting_fk_lt_id_fkey FOREIGN KEY (fk_lt_id) REFERENCES core.lookup_type(id) ON DELETE SET NULL;


--
-- Name: user_setting core_user_setting_fk_lv_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_setting
    ADD CONSTRAINT core_user_setting_fk_lv_id_fkey FOREIGN KEY (fk_lv_id) REFERENCES core.lookup_value(id) ON DELETE SET NULL;


--
-- Name: user_setting core_user_setting_fk_user_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: stadmin
--

ALTER TABLE ONLY core.user_setting
    ADD CONSTRAINT core_user_setting_fk_user_id_fkey FOREIGN KEY (fk_user_id) REFERENCES core."user"(id) ON DELETE SET NULL;


--
-- Name: account crm_account_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account
    ADD CONSTRAINT crm_account_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: account crm_account_fk_lv_account_status_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account
    ADD CONSTRAINT crm_account_fk_lv_account_status_fkey FOREIGN KEY (fk_lv_account_status) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: account_setting crm_account_setting_fk_account_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account_setting
    ADD CONSTRAINT crm_account_setting_fk_account_id_fkey FOREIGN KEY (fk_account_id) REFERENCES crm.account(id) ON DELETE SET NULL;


--
-- Name: account_setting crm_account_setting_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account_setting
    ADD CONSTRAINT crm_account_setting_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: account_setting crm_account_setting_fk_lt_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account_setting
    ADD CONSTRAINT crm_account_setting_fk_lt_id_fkey FOREIGN KEY (fk_lt_id) REFERENCES crm.lookup_type(id) ON DELETE SET NULL;


--
-- Name: account_setting crm_account_setting_fk_lv_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.account_setting
    ADD CONSTRAINT crm_account_setting_fk_lv_id_fkey FOREIGN KEY (fk_lv_id) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: campaign crm_campaign_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign
    ADD CONSTRAINT crm_campaign_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: campaign crm_campaign_fk_lv_campaign_status_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign
    ADD CONSTRAINT crm_campaign_fk_lv_campaign_status_fkey FOREIGN KEY (fk_lv_campaign_status) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: campaign crm_campaign_fk_lv_campaign_type_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign
    ADD CONSTRAINT crm_campaign_fk_lv_campaign_type_fkey FOREIGN KEY (fk_lv_campaign_type) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: campaign_setting crm_campaign_setting_fk_campaign_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign_setting
    ADD CONSTRAINT crm_campaign_setting_fk_campaign_id_fkey FOREIGN KEY (fk_campaign_id) REFERENCES crm.campaign(id) ON DELETE SET NULL;


--
-- Name: campaign_setting crm_campaign_setting_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign_setting
    ADD CONSTRAINT crm_campaign_setting_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: campaign_setting crm_campaign_setting_fk_lt_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign_setting
    ADD CONSTRAINT crm_campaign_setting_fk_lt_id_fkey FOREIGN KEY (fk_lt_id) REFERENCES crm.lookup_type(id) ON DELETE SET NULL;


--
-- Name: campaign_setting crm_campaign_setting_fk_lv_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.campaign_setting
    ADD CONSTRAINT crm_campaign_setting_fk_lv_id_fkey FOREIGN KEY (fk_lv_id) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: interaction crm_interaction_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.interaction
    ADD CONSTRAINT crm_interaction_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: interaction crm_interaction_fk_lv_interaction_type_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.interaction
    ADD CONSTRAINT crm_interaction_fk_lv_interaction_type_fkey FOREIGN KEY (fk_lv_interaction_type) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: interaction crm_interaction_fk_user_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.interaction
    ADD CONSTRAINT crm_interaction_fk_user_id_fkey FOREIGN KEY (fk_user_id) REFERENCES crm."user"(id) ON DELETE SET NULL;


--
-- Name: lead crm_lead_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lead
    ADD CONSTRAINT crm_lead_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: lead crm_lead_fk_lv_lead_status_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lead
    ADD CONSTRAINT crm_lead_fk_lv_lead_status_fkey FOREIGN KEY (fk_lv_lead_status) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: lookup_type crm_lookup_type_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_type
    ADD CONSTRAINT crm_lookup_type_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: lookup_type crm_lookup_type_fk_lt_id_parent_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_type
    ADD CONSTRAINT crm_lookup_type_fk_lt_id_parent_fkey FOREIGN KEY (fk_lt_id_parent) REFERENCES crm.lookup_type(id) ON DELETE SET NULL;


--
-- Name: lookup_type crm_lookup_type_fk_lv_data_type_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_type
    ADD CONSTRAINT crm_lookup_type_fk_lv_data_type_fkey FOREIGN KEY (fk_lv_data_type) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: lookup_type crm_lookup_type_fk_lv_input_type_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_type
    ADD CONSTRAINT crm_lookup_type_fk_lv_input_type_fkey FOREIGN KEY (fk_lv_input_type) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: lookup_value crm_lookup_value_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_value
    ADD CONSTRAINT crm_lookup_value_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: lookup_value crm_lookup_value_fk_lt_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.lookup_value
    ADD CONSTRAINT crm_lookup_value_fk_lt_id_fkey FOREIGN KEY (fk_lt_id) REFERENCES crm.lookup_type(id) ON DELETE SET NULL;


--
-- Name: note crm_note_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.note
    ADD CONSTRAINT crm_note_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: note crm_note_fk_user_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.note
    ADD CONSTRAINT crm_note_fk_user_id_fkey FOREIGN KEY (fk_user_id) REFERENCES crm."user"(id) ON DELETE SET NULL;


--
-- Name: opportunity crm_opportunity_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.opportunity
    ADD CONSTRAINT crm_opportunity_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: opportunity crm_opportunity_fk_lv_opportunity_stage_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.opportunity
    ADD CONSTRAINT crm_opportunity_fk_lv_opportunity_stage_fkey FOREIGN KEY (fk_lv_opportunity_stage) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: tag crm_tag_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.tag
    ADD CONSTRAINT crm_tag_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: tagging crm_tagging_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.tagging
    ADD CONSTRAINT crm_tagging_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: tagging crm_tagging_fk_tag_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.tagging
    ADD CONSTRAINT crm_tagging_fk_tag_id_fkey FOREIGN KEY (fk_tag_id) REFERENCES crm.tag(id) ON DELETE CASCADE;


--
-- Name: task crm_task_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.task
    ADD CONSTRAINT crm_task_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: task crm_task_fk_lv_task_status_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.task
    ADD CONSTRAINT crm_task_fk_lv_task_status_fkey FOREIGN KEY (fk_lv_task_status) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: task crm_task_fk_user_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.task
    ADD CONSTRAINT crm_task_fk_user_id_fkey FOREIGN KEY (fk_user_id) REFERENCES crm."user"(id) ON DELETE SET NULL;


--
-- Name: user crm_user_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm."user"
    ADD CONSTRAINT crm_user_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: user_group crm_user_group_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group
    ADD CONSTRAINT crm_user_group_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: user_group crm_user_group_fk_lv_user_group_type_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group
    ADD CONSTRAINT crm_user_group_fk_lv_user_group_type_fkey FOREIGN KEY (fk_lv_user_group_type) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: user_group_setting crm_user_group_setting_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_setting
    ADD CONSTRAINT crm_user_group_setting_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: user_group_setting crm_user_group_setting_fk_lt_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_setting
    ADD CONSTRAINT crm_user_group_setting_fk_lt_id_fkey FOREIGN KEY (fk_lt_id) REFERENCES crm.lookup_type(id) ON DELETE SET NULL;


--
-- Name: user_group_setting crm_user_group_setting_fk_lv_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_setting
    ADD CONSTRAINT crm_user_group_setting_fk_lv_id_fkey FOREIGN KEY (fk_lv_id) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: user_group_setting crm_user_group_setting_fk_user_group_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_setting
    ADD CONSTRAINT crm_user_group_setting_fk_user_group_id_fkey FOREIGN KEY (fk_user_group_id) REFERENCES crm.user_group(id) ON DELETE SET NULL;


--
-- Name: user_group_user crm_user_group_user_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_user
    ADD CONSTRAINT crm_user_group_user_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: user_group_user crm_user_group_user_fk_user_group_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_user
    ADD CONSTRAINT crm_user_group_user_fk_user_group_id_fkey FOREIGN KEY (fk_user_group_id) REFERENCES crm.user_group(id) ON DELETE SET NULL;


--
-- Name: user_group_user crm_user_group_user_fk_user_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_group_user
    ADD CONSTRAINT crm_user_group_user_fk_user_id_fkey FOREIGN KEY (fk_user_id) REFERENCES crm."user"(id) ON DELETE SET NULL;


--
-- Name: user_setting crm_user_setting_fk_core_entity_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_setting
    ADD CONSTRAINT crm_user_setting_fk_core_entity_id_fkey FOREIGN KEY (fk_core_entity_id) REFERENCES core.entity(id) ON DELETE SET NULL;


--
-- Name: user_setting crm_user_setting_fk_lt_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_setting
    ADD CONSTRAINT crm_user_setting_fk_lt_id_fkey FOREIGN KEY (fk_lt_id) REFERENCES crm.lookup_type(id) ON DELETE SET NULL;


--
-- Name: user_setting crm_user_setting_fk_lv_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_setting
    ADD CONSTRAINT crm_user_setting_fk_lv_id_fkey FOREIGN KEY (fk_lv_id) REFERENCES crm.lookup_value(id) ON DELETE SET NULL;


--
-- Name: user_setting crm_user_setting_fk_user_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: stadmin
--

ALTER TABLE ONLY crm.user_setting
    ADD CONSTRAINT crm_user_setting_fk_user_id_fkey FOREIGN KEY (fk_user_id) REFERENCES crm."user"(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

