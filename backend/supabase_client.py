"""
Shared Supabase service-role client.
Service-role key bypasses RLS — only use for server-side operations
where the user identity is already verified via JWT.
Never expose this client or its key to the frontend.
"""
from supabase import create_client, Client
from config import get_settings

settings = get_settings()
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
