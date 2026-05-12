import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, public_token } = await req.json()

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID')
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET')
    const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox'
    const PLAID_URL = `https://${PLAID_ENV}.plaid.com`

    if (action === 'create_link_token') {
      const response = await fetch(`${PLAID_URL}/link/token/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          client_name: 'Driver Command Center',
          country_codes: ['US'],
          language: 'en',
          user: {
            client_user_id: Deno.env.get('PLAID_CLIENT_ID') || 'pbtrack_user',
          },
          products: ['transactions'],
        }),
      })

      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'exchange_token') {
      // 1. Exchange public_token for access_token
      const exchangeResponse = await fetch(`${PLAID_URL}/item/public_token/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          public_token: public_token,
        }),
      })
      const exchangeData = await exchangeResponse.json()
      const access_token = exchangeData.access_token

      // 2. Store in Supabase
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Save the access_token in the database so it can be reused later
      // The user would likely need a plaid_items or user table for this in a real application,
      // but for this simple app, we can just save it or proceed to fetch.
      // Plaid /transactions/get requires time to extract data after exchanging the token.
      // The recommended way is to use webhooks to get notified when transactions are ready.
      // Or to use /transactions/sync for initial extraction.

      // Let's use /transactions/sync which works better for immediate extraction
      const transactionsResponse = await fetch(`${PLAID_URL}/transactions/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          access_token: access_token,
        }),
      })
      const transactionsData = await transactionsResponse.json()
      const transactions = transactionsData.added || []

      // Now insert the access token into a table for future use
      const { error: tokenError } = await supabaseClient
        .from('plaid_items')
        .upsert({ item_id: exchangeData.item_id, access_token: access_token }, { onConflict: 'item_id' })

      if (tokenError) {
        console.error("Supabase token insert error:", tokenError)
      }

      const transactionsToInsert = transactions.map((t: any) => ({
        account_id: t.account_id,
        amount: t.amount,
        date: t.date,
        name: t.name,
        merchant_name: t.merchant_name,
        pending: t.pending,
        transaction_id: t.transaction_id,
        category: t.category ? t.category.join(', ') : null,
      }))

      if (transactionsToInsert.length > 0) {
        const { error } = await supabaseClient
          .from('plaid_transactions')
          .upsert(transactionsToInsert, { onConflict: 'transaction_id' })

        if (error) {
          console.error("Supabase insert error:", error)
        }
      }

      return new Response(JSON.stringify({ success: true, transactions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})