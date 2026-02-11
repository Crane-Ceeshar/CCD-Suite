-- Allow portal_messages.sender_id to be nullable (for client guest messages)
alter table public.portal_messages alter column sender_id drop not null;

-- Add sender_email column for identifying client guests
alter table public.portal_messages add column if not exists sender_email text;
