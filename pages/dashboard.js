import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Dashboard() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Welcome to ZeusBolt ⚡</h1>
      <p>You are successfully logged in.</p>

      <button
        style={{
          marginTop: 20,
          padding: '12px 20px',
          fontSize: 16,
          cursor: 'pointer'
        }}
      >
        Create New App
      </button>
    </div>
  )
}
