-- Enable required extensions
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- moddatetime for auto-updating updated_at columns
create extension if not exists "moddatetime" with schema extensions;
