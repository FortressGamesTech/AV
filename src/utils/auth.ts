'use client'

import { createBrowserClient } from '@/utils/supabase'

const auth = {
  // Mock role for now to get the sidebar working
  getRole: () => 'administrator', // Replace with actual role retrieval when authentication is fixed
  isLoading: false,
}

export default auth
