-- Supabase — the waitlist backend for a static host, as a real Postgres table.
--
-- WHY THIS SHAPE
-- --------------
-- The site is served by GitHub Pages, which runs no server code, so anything the
-- form talks to must be callable straight from the browser. That rules out every
-- "free Postgres" whose only interface is a connection string — Neon, Turso,
-- Upstash and friends would all need the credential shipped in main.js, where
-- anyone can read it and drop the table.
--
-- Supabase is safe here for one specific reason: its `anon` key is *designed* to
-- be public, and Row Level Security decides what that key may actually do. The
-- policy below grants it nothing at all on the table. Everything goes through
-- one SECURITY DEFINER function, so the browser can join the waitlist and cannot
-- read it, count it, or change it.
--
-- SETUP
-- -----
--  1. supabase.com → new project (free tier). Pick the Mumbai/Singapore region.
--  2. SQL Editor → paste this whole file → Run.
--  3. Project Settings → API. Copy the Project URL and the `anon` `public` key.
--  4. In main.js set:
--       url:     https://<project-ref>.supabase.co/rest/v1/rpc/join_waitlist
--       headers: apikey + Authorization: Bearer <anon key>
--  5. Read the list any time in Table Editor → waitlist, or export CSV from there.
--
-- Free-tier caveat worth knowing before you rely on it: a project with no
-- traffic for 7 days is paused and needs a click in the dashboard to wake. A
-- live waitlist collecting signups will not pause, but a quiet month can.
--
-- EMAIL VERIFICATION — added alongside this table's confirmation email.
-- ----------------------------------------------------------------------
-- Verification is mandatory, and it is the fraud gate on the referral loop:
-- referred_by is still stamped at signup so the credit isn't lost, but the
-- referrer's count only increments once the REFERRED person clicks the link
-- in their own inbox (confirm_waitlist_email, below). A script that mints a
-- thousand emails against one code no longer moves that code's count — every
-- one of those emails would have to be a real inbox someone actually opened.
--
-- SETUP, on top of steps 1-5 above:
--  6. Extensions → enable pg_net (usually on already; the CREATE EXTENSION
--     below is a no-op if so).
--  7. Edge Functions Secrets → add RESEND_API_KEY (from resend.com) and a
--     hand-picked FROM address on a domain verified in Resend.
--  8. Generate any long random string yourself (e.g. `openssl rand -hex 32`).
--     Set it as an Edge Function secret named TRIGGER_SECRET, and paste the
--     same value into the trigger below, replacing PASTE_YOUR_TRIGGER_SECRET.
--     This is deliberately NOT a Supabase "secret API key" — Supabase never
--     returns one of those after creation, including to the project owner,
--     so there is no way to also put its value here. A self-generated value
--     is what proves the email-send request came from this database and not
--     from anyone who found the function's URL — never commit the real value;
--     this repo's landing/ directory mirrors to a public GitHub Pages repo.
--  9. From landing/, `supabase link --project-ref <project-ref>` once, then
--     `supabase functions deploy send-waitlist-email` and
--     `supabase functions deploy verify-waitlist`.
--
-- BOUNCE DETECTION — for a syntactically valid but nonexistent address.
-- ----------------------------------------------------------------------
-- A bounce is not knowable at signup time — Resend's send API returns success
-- the moment it hands the email to the receiving mail server, not once
-- delivery is confirmed, and the actual bounce can arrive seconds to minutes
-- later via webhook. So this does NOT block the signup response; it records
-- the bounce against the row asynchronously, and the browser picks it up on
-- a later visit (checkWaitlistStatus in main.js) rather than waiting live.
--
-- SETUP, on top of steps 1-9 above:
-- 10. `supabase functions deploy resend-webhook`.
-- 11. Resend dashboard → Webhooks → add endpoint, URL
--     https://<project-ref>.functions.supabase.co/resend-webhook, events
--     email.bounced and email.complained. Copy the signing secret it shows
--     you and set it as an Edge Function secret named RESEND_WEBHOOK_SECRET.

create table if not exists public.waitlist (
  id           bigint generated always as identity primary key,
  email        text        not null unique,
  code         text        not null unique,
  role         text,
  referred_by  text,
  referrals    integer     not null default 0,
  joined_at    timestamptz not null default now(),
  -- Free text from the client. Never rendered anywhere, kept only so a spike of
  -- signups can be told apart from a spike of one script.
  user_agent   text,
  verified     boolean     not null default false,
  verify_token text        unique,
  verified_at  timestamptz,
  resend_email_id text,
  bounced_at   timestamptz,
  constraint waitlist_role_check check (role is null or role in ('organizer', 'rider'))
);

alter table public.waitlist add column if not exists verified boolean not null default false;
alter table public.waitlist add column if not exists verify_token text unique;
alter table public.waitlist add column if not exists verified_at timestamptz;
alter table public.waitlist add column if not exists resend_email_id text;
alter table public.waitlist add column if not exists bounced_at timestamptz;

create index if not exists waitlist_code_idx on public.waitlist (code);

alter table public.waitlist enable row level security;

-- No policies are created, which is the point. With RLS on and no policy, the
-- anon key can do nothing to this table directly: no select, no insert, no
-- update. An exposed key is then worth exactly nothing to whoever finds it.
revoke all on public.waitlist from anon, authenticated;

-- service_role bypasses RLS by default, but base table privileges are a
-- separate layer Postgres still enforces regardless — send-waitlist-email
-- needs this to stamp resend_email_id after a send, using the service role
-- key it already holds (never the anon key, which stays locked out above).
grant select, update on public.waitlist to service_role;

-- Codes get read aloud and typed from memory, so no I/O/0/1.
create or replace function public.new_waitlist_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1),
    ''
  )
  from generate_series(1, 6);
$$;

-- The one thing the browser may call.
--
-- SECURITY DEFINER means it runs as the owner and so bypasses the RLS lockout
-- above; `search_path` is pinned because a definer function that resolves names
-- through a caller-controlled path is the classic way this pattern gets abused.
create or replace function public.join_waitlist(
  p_email text,
  p_role  text default null,
  p_ref   text default null,
  p_ua    text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email    text := lower(trim(p_email));
  v_role     text := nullif(p_role, '');
  v_ref      text := nullif(upper(trim(coalesce(p_ref, ''))), '');
  v_existing public.waitlist%rowtype;
  v_code     text;
  v_token    text;
  v_credited text := null;
begin
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' or length(v_email) > 254 then
    return json_build_object('ok', false, 'error', 'invalid_email');
  end if;

  -- Only two roles mean anything to the launch sequence; anything else is
  -- dropped rather than stored, so a hand-crafted call cannot write junk.
  if v_role is not null and v_role not in ('organizer', 'rider') then
    v_role := null;
  end if;

  if v_ref is not null and v_ref !~ '^[A-Z0-9]{4,12}$' then
    v_ref := null;
  end if;

  -- Idempotent: a returning visitor re-checking their progress must be told the
  -- same story, not handed a second code.
  select * into v_existing from public.waitlist where email = v_email;
  if found then
    if v_role is not null and v_existing.role is null then
      update public.waitlist set role = v_role where id = v_existing.id;
    end if;
    return json_build_object(
      'ok', true, 'code', v_existing.code, 'referrals', v_existing.referrals,
      'goal', 3, 'returning', true
    );
  end if;

  loop
    v_code := public.new_waitlist_code();
    exit when not exists (select 1 from public.waitlist where code = v_code);
  end loop;

  -- A self-referral or an unknown code is stored as no attribution rather than
  -- an error the visitor ever sees. The referrer's count does NOT move yet —
  -- that happens in confirm_waitlist_email() once this new signup verifies
  -- its own inbox, which is the actual fraud gate on the loop.
  if v_ref is not null and exists (
    select 1 from public.waitlist where code = v_ref and email <> v_email
  ) then
    v_credited := v_ref;
  end if;

  -- Hex, not base64 — no URL-encoding to get wrong when this goes into an
  -- email link. Two UUIDs concatenated is 32 bytes of randomness, comfortably
  -- past guessable; gen_random_uuid() is core Postgres, no extension needed.
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.waitlist (email, code, role, referred_by, user_agent, verify_token)
  values (v_email, v_code, v_role, v_credited, left(coalesce(p_ua, ''), 200), v_token);

  return json_build_object('ok', true, 'code', v_code, 'referrals', 0, 'goal', 3, 'returning', false);
end;
$$;

-- Nobody may call this as the table owner by accident; grant it explicitly to
-- the two roles the browser can present.
revoke all on function public.join_waitlist(text, text, text, text) from public;
grant execute on function public.join_waitlist(text, text, text, text) to anon, authenticated;

-- Called by the verify-waitlist Edge Function when someone clicks the link in
-- their confirmation email — never by the browser directly, which is why this
-- is granted to service_role only, not anon. Marks the row verified, and only
-- now credits whoever referred them (see the note above CREATE TABLE for why
-- crediting waits this long). Returns enough for the Edge Function to decide
-- whether to also fire the milestone email, without a second round trip.
create or replace function public.confirm_waitlist_email(p_token text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row     public.waitlist%rowtype;
  v_ref     public.waitlist%rowtype;
  v_crossed boolean := false;
begin
  select * into v_row from public.waitlist where verify_token = p_token;
  if not found then
    return json_build_object('ok', false, 'error', 'invalid_token');
  end if;

  if v_row.verified then
    return json_build_object(
      'ok', true, 'already', true, 'role', v_row.role, 'code', v_row.code, 'referrals', v_row.referrals
    );
  end if;

  update public.waitlist set verified = true, verified_at = now() where id = v_row.id;

  if v_row.referred_by is not null then
    update public.waitlist
       set referrals = referrals + 1
     where code = v_row.referred_by
    returning * into v_ref;

    if found and v_ref.referrals = 3 then
      v_crossed := true;
    end if;
  end if;

  return json_build_object(
    'ok', true, 'already', false, 'role', v_row.role, 'code', v_row.code, 'referrals', v_row.referrals,
    -- Only returned on a genuine first verification (this branch, never the
    -- v_row.verified early-return above) — that's what verify-waitlist uses
    -- to send the founder email exactly once per person, ever.
    'email', v_row.email,
    'milestone', v_crossed,
    'referrer_email', case when v_crossed then v_ref.email else null end
  );
end;
$$;

revoke all on function public.confirm_waitlist_email(text) from public, anon, authenticated;
grant execute on function public.confirm_waitlist_email(text) to service_role;

-- ---------- The confirmation-email trigger ----------
-- Fires once per real signup (the idempotent return path in join_waitlist()
-- above never inserts a row, so re-submitting an existing email never
-- re-sends this). Calls pg_net directly rather than through Supabase's
-- supabase_functions.http_request wrapper — that wrapper only exists once
-- Database Webhooks has been opened at least once in the Dashboard, which
-- is a manual bootstrap step this file can't do for you, and there's no
-- reason to depend on it when pg_net alone does the same job.
create extension if not exists pg_net;

create or replace function public.waitlist_send_confirmation_fn()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp, extensions
as $$
begin
  perform net.http_post(
    url := 'https://axsgjzhdlhlkpkydqxbp.functions.supabase.co/send-waitlist-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-lh-secret', 'PASTE_YOUR_TRIGGER_SECRET'
    ),
    body := jsonb_build_object('record', to_jsonb(new)),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  -- A misconfigured webhook must never block a signup from completing.
  return new;
end;
$$;

drop trigger if exists waitlist_send_confirmation on public.waitlist;
create trigger waitlist_send_confirmation
  after insert on public.waitlist
  for each row
  execute function public.waitlist_send_confirmation_fn();

-- Called by resend-webhook only (Resend's own signature is what authenticates
-- the caller, not a Postgres grant — service_role is enough since the Edge
-- Function itself is the trust boundary). Matches by Resend's own email id,
-- stamped onto the row by send-waitlist-email right after a successful send.
create or replace function public.mark_waitlist_bounced(p_email_id text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.waitlist set bounced_at = now()
   where resend_email_id = p_email_id and bounced_at is null;
$$;

revoke all on function public.mark_waitlist_bounced(text) from public, anon, authenticated;
grant execute on function public.mark_waitlist_bounced(text) to service_role;

-- Called by the browser on a return visit to refresh what it cached at
-- signup — a bounce is never knowable at signup time (see the note above),
-- so this is how a later visit finds out. Scoped to a code, not an email:
-- the code is already shareable/public by design, so handing back a boolean
-- against it leaks nothing RLS was protecting.
create or replace function public.check_waitlist_status(p_code text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.waitlist%rowtype;
begin
  select * into v_row from public.waitlist where code = upper(trim(p_code));
  if not found then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  return json_build_object(
    'ok', true, 'verified', v_row.verified, 'bounced', v_row.bounced_at is not null,
    'referrals', v_row.referrals
  );
end;
$$;

revoke all on function public.check_waitlist_status(text) from public;
grant execute on function public.check_waitlist_status(text) to anon, authenticated;
