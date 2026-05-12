import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SPLITWISE_API_KEY = Deno.env.get('SPLITWISE_API_KEY')
    if (!SPLITWISE_API_KEY) {
       throw new Error("Missing SPLITWISE_API_KEY");
    }

    const response = await fetch('https://secure.splitwise.com/api/v3.0/get_current_user', {
        headers: {
            'Authorization': `Bearer ${SPLITWISE_API_KEY}`
        }
    })

    const data = await response.json();

    // We can also fetch the groups or friends to get the balances
    const friendsResponse = await fetch('https://secure.splitwise.com/api/v3.0/get_friends', {
        headers: {
            'Authorization': `Bearer ${SPLITWISE_API_KEY}`
        }
    })

    const friendsData = await friendsResponse.json();

    let totalDebt = 0;
    const friends = friendsData.friends || [];

    friends.forEach((friend: any) => {
        friend.balance.forEach((bal: any) => {
             // Splitwise represents amount you owe as a negative balance
             const amt = parseFloat(bal.amount);
             if (amt < 0) {
                 // Convert negative balance to positive debt
                 totalDebt += Math.abs(amt);
             }
        })
    });

    return new Response(JSON.stringify({ success: true, user: data.user, totalDebt }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})