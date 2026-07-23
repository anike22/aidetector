import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { target_domain, contact_email, publication, link_type, subject, message } = body

    // Validate inputs
    if (!target_domain || !contact_email) {
      return new Response(JSON.stringify({ error: 'Missing target domain or contact email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // In a production environment, you would use an email service like Resend, SendGrid, Mailgun, etc.
    // 1. Get user's Gmail token
    const { data: tokenData, error: tokenError } = await supabase
      .from('gmail_tokens')
      .select('access_token_encrypted, email_address')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Gmail account not connected. Please connect your Gmail account in the settings.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = tokenData.access_token_encrypted

    // Format the email per RFC 2822
    const emailLines = [
      `To: ${contact_email}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      '',
      message
    ]
    const emailContent = emailLines.join('\r\n')
    // Base64url encode the message
    const encodedMessage = btoa(unescape(encodeURIComponent(emailContent)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Send using Gmail API
    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    })

    if (!gmailRes.ok) {
      const gmailError = await gmailRes.json()
      console.error('Gmail API Error:', gmailError)
      return new Response(JSON.stringify({ error: 'Failed to send email via Gmail API' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const gmailData = await gmailRes.json()

    console.log(`Successfully sent email to ${contact_email} via Gmail. Message ID: ${gmailData.id}`)

    const newContact = {
      user_id: user.id,
      target_domain,
      contact_name: 'Editor',
      contact_email,
      publication,
      link_type,
      status: 'Contacted',
      open_rate: 0,
      notes: `Sent automated pitch via Gmail: ${subject}`
    };

    const { data: contactData, error: dbError } = await supabase
      .from('link_building_crm')
      .insert(newContact)
      .select()
      .single()

    // Also record it in outreach_emails table
    await supabase.from('outreach_emails').insert({
      user_id: user.id,
      prospect_id: contactData ? contactData.id : null,
      target_domain,
      contact_email,
      subject,
      body: message,
      status: 'sent',
      gmail_message_id: gmailData.id,
      sent_at: new Date().toISOString()
    })

    if (dbError) {
      console.error('Error adding to CRM:', dbError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pitch dispatched successfully via AI agent and Gmail API',
        contact: contactData || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error dispatching pitch:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})