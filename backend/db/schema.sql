--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.8 (Ubuntu 16.8-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    app_template_id integer,
    app_name text,
    app_description text,
    app_icon_url text,
    username text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    enc_password bytea NOT NULL,
    memo text NOT NULL,
    pls_delete boolean NOT NULL,
    message text NOT NULL,
    passer_id uuid NOT NULL,
    trust_id integer,
    is_disclosed boolean NOT NULL,
    custom_data jsonb
);


ALTER TABLE public.accounts OWNER TO "user";

--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_id_seq OWNER TO "user";

--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: alive_check_histories; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.alive_check_histories (
    id uuid NOT NULL,
    target_user_id uuid NOT NULL,
    check_time timestamp without time zone NOT NULL,
    check_method integer NOT NULL,
    check_success boolean NOT NULL,
    check_success_time timestamp without time zone,
    custom_data jsonb
);


ALTER TABLE public.alive_check_histories OWNER TO "user";

--
-- Name: app_template; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.app_template (
    id integer NOT NULL,
    app_name text NOT NULL,
    app_description text NOT NULL,
    app_icon_url text NOT NULL
);


ALTER TABLE public.app_template OWNER TO "user";

--
-- Name: app_template_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.app_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.app_template_id_seq OWNER TO "user";

--
-- Name: app_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.app_template_id_seq OWNED BY public.app_template.id;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    device_type integer NOT NULL,
    device_description text,
    device_username text,
    device_icon_url text,
    enc_password bytea NOT NULL,
    memo text NOT NULL,
    message text NOT NULL,
    passer_id uuid NOT NULL,
    trust_id integer,
    is_disclosed boolean NOT NULL,
    custom_data jsonb
);


ALTER TABLE public.devices OWNER TO "user";

--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.devices_id_seq OWNER TO "user";

--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: disclosures; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.disclosures (
    id integer NOT NULL,
    requester_id uuid NOT NULL,
    passer_id uuid NOT NULL,
    issued_time timestamp without time zone NOT NULL,
    in_progress boolean NOT NULL,
    disclosed boolean NOT NULL,
    disclosed_at timestamp without time zone,
    prevented_by uuid,
    deadline timestamp without time zone NOT NULL,
    custom_data jsonb
);


ALTER TABLE public.disclosures OWNER TO "user";

--
-- Name: disclosures_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.disclosures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.disclosures_id_seq OWNER TO "user";

--
-- Name: disclosures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.disclosures_id_seq OWNED BY public.disclosures.id;


--
-- Name: passkeys; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.passkeys (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    rp_id text NOT NULL,
    credential_id text NOT NULL,
    user_name text NOT NULL,
    public_key bytea NOT NULL,
    private_key bytea NOT NULL,
    sign_count bigint NOT NULL
);


ALTER TABLE public.passkeys OWNER TO "user";

--
-- Name: passkeys_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.passkeys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.passkeys_id_seq OWNER TO "user";

--
-- Name: passkeys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.passkeys_id_seq OWNED BY public.passkeys.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO "user";

--
-- Name: schema_migrations_seed; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.schema_migrations_seed (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


ALTER TABLE public.schema_migrations_seed OWNER TO "user";

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.subscriptions (
    id integer NOT NULL,
    service_name text,
    icon_url text,
    username text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    enc_password bytea NOT NULL,
    amount integer NOT NULL,
    currency text NOT NULL,
    billing_cycle text NOT NULL,
    memo text NOT NULL,
    pls_delete boolean NOT NULL,
    message text NOT NULL,
    passer_id uuid NOT NULL,
    trust_id integer,
    is_disclosed boolean NOT NULL,
    custom_data jsonb
);


ALTER TABLE public.subscriptions OWNER TO "user";

--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscriptions_id_seq OWNER TO "user";

--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: trusts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.trusts (
    id integer NOT NULL,
    receiver_user_id uuid NOT NULL,
    passer_user_id uuid NOT NULL
);


ALTER TABLE public.trusts OWNER TO "user";

--
-- Name: trusts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.trusts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trusts_id_seq OWNER TO "user";

--
-- Name: trusts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.trusts_id_seq OWNED BY public.trusts.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    default_receiver_id uuid,
    clerk_user_id text NOT NULL
);


ALTER TABLE public.users OWNER TO "user";

--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: app_template id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.app_template ALTER COLUMN id SET DEFAULT nextval('public.app_template_id_seq'::regclass);


--
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: disclosures id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.disclosures ALTER COLUMN id SET DEFAULT nextval('public.disclosures_id_seq'::regclass);


--
-- Name: passkeys id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.passkeys ALTER COLUMN id SET DEFAULT nextval('public.passkeys_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: trusts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.trusts ALTER COLUMN id SET DEFAULT nextval('public.trusts_id_seq'::regclass);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: alive_check_histories alive_check_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.alive_check_histories
    ADD CONSTRAINT alive_check_histories_pkey PRIMARY KEY (id);


--
-- Name: app_template app_template_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.app_template
    ADD CONSTRAINT app_template_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: disclosures disclosures_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.disclosures
    ADD CONSTRAINT disclosures_pkey PRIMARY KEY (id);


--
-- Name: passkeys passkeys_credential_id_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.passkeys
    ADD CONSTRAINT passkeys_credential_id_unique UNIQUE (credential_id);


--
-- Name: passkeys passkeys_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.passkeys
    ADD CONSTRAINT passkeys_pkey PRIMARY KEY (id);


--
-- Name: passkeys passkeys_user_id_rp_id_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.passkeys
    ADD CONSTRAINT passkeys_user_id_rp_id_unique UNIQUE (user_id, rp_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: schema_migrations_seed schema_migrations_seed_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.schema_migrations_seed
    ADD CONSTRAINT schema_migrations_seed_pkey PRIMARY KEY (version);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: trusts trusts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.trusts
    ADD CONSTRAINT trusts_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_app_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_app_template_id_fkey FOREIGN KEY (app_template_id) REFERENCES public.app_template(id);


--
-- Name: accounts accounts_passer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_passer_id_fkey FOREIGN KEY (passer_id) REFERENCES public.users(id);


--
-- Name: accounts accounts_trust_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_trust_id_fkey FOREIGN KEY (trust_id) REFERENCES public.trusts(id);


--
-- Name: alive_check_histories alive_check_histories_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.alive_check_histories
    ADD CONSTRAINT alive_check_histories_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id);


--
-- Name: devices devices_passer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_passer_id_fkey FOREIGN KEY (passer_id) REFERENCES public.users(id);


--
-- Name: devices devices_trust_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_trust_id_fkey FOREIGN KEY (trust_id) REFERENCES public.trusts(id);


--
-- Name: disclosures disclosures_passer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.disclosures
    ADD CONSTRAINT disclosures_passer_id_fkey FOREIGN KEY (passer_id) REFERENCES public.users(id);


--
-- Name: disclosures disclosures_prevented_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.disclosures
    ADD CONSTRAINT disclosures_prevented_by_fkey FOREIGN KEY (prevented_by) REFERENCES public.alive_check_histories(id);


--
-- Name: disclosures disclosures_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.disclosures
    ADD CONSTRAINT disclosures_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id);


--
-- Name: passkeys passkeys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.passkeys
    ADD CONSTRAINT passkeys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: subscriptions subscriptions_passer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_passer_id_fkey FOREIGN KEY (passer_id) REFERENCES public.users(id);


--
-- Name: subscriptions subscriptions_trust_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_trust_id_fkey FOREIGN KEY (trust_id) REFERENCES public.trusts(id);


--
-- Name: trusts trusts_passer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.trusts
    ADD CONSTRAINT trusts_passer_user_id_fkey FOREIGN KEY (passer_user_id) REFERENCES public.users(id);


--
-- Name: trusts trusts_receiver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.trusts
    ADD CONSTRAINT trusts_receiver_user_id_fkey FOREIGN KEY (receiver_user_id) REFERENCES public.users(id);


--
-- Name: users users_default_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_default_receiver_id_fkey FOREIGN KEY (default_receiver_id) REFERENCES public.users(id);


--
-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: user
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: accounts accounts_modification; Type: POLICY; Schema: public; Owner: user
--

CREATE POLICY accounts_modification ON public.accounts USING ((passer_id = (current_setting('digi_baton.current_user_id'::text))::uuid)) WITH CHECK ((passer_id = (current_setting('digi_baton.current_user_id'::text))::uuid));


--
-- Name: accounts accounts_select; Type: POLICY; Schema: public; Owner: user
--

CREATE POLICY accounts_select ON public.accounts FOR SELECT USING (((passer_id = (current_setting('digi_baton.current_user_id'::text))::uuid) OR (is_disclosed AND (EXISTS ( SELECT 1
   FROM public.trusts t
  WHERE ((t.id = accounts.trust_id) AND (t.receiver_user_id = (current_setting('digi_baton.current_user_id'::text))::uuid) AND (t.passer_user_id = accounts.passer_id)))))));


--
-- Name: devices; Type: ROW SECURITY; Schema: public; Owner: user
--

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

--
-- Name: devices devices_modification; Type: POLICY; Schema: public; Owner: user
--

CREATE POLICY devices_modification ON public.devices USING ((passer_id = (current_setting('digi_baton.current_user_id'::text))::uuid)) WITH CHECK ((passer_id = (current_setting('digi_baton.current_user_id'::text))::uuid));


--
-- Name: devices devices_select; Type: POLICY; Schema: public; Owner: user
--

CREATE POLICY devices_select ON public.devices FOR SELECT USING (((passer_id = (current_setting('digi_baton.current_user_id'::text))::uuid) OR (is_disclosed AND (EXISTS ( SELECT 1
   FROM public.trusts t
  WHERE ((t.id = devices.trust_id) AND (t.receiver_user_id = (current_setting('digi_baton.current_user_id'::text))::uuid) AND (t.passer_user_id = devices.passer_id)))))));


--
-- PostgreSQL database dump complete
--

