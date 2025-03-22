
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const requestData = await req.json()
    const { imageData, isPassive } = requestData

    if (!imageData) {
      return new Response(JSON.stringify({ error: 'Image data is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Remove data:image/jpeg;base64, prefix if present
    const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '')

    // Get Google Cloud credentials from environment
    const googleCredentials = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS')
    if (!googleCredentials) {
      console.error('Missing Google Cloud credentials')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const credentials = JSON.parse(googleCredentials)

    // Prepare Vision API request
    const visionApiEndpoint = 'https://vision.googleapis.com/v1/images:annotate'
    
    // First, get an access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: generateJWT(credentials)
      })
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('Failed to get access token:', tokenData)
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const accessToken = tokenData.access_token

    // Prepare Vision API request
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'FACE_DETECTION',
              maxResults: 10
            }
          ]
        }
      ]
    }

    // Call Vision API
    const apiResponse = await fetch(visionApiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const apiData = await apiResponse.json()
    
    // Process the response
    const hasFaces = apiData?.responses?.[0]?.faceAnnotations?.length > 0

    console.log(`Vision API detected ${hasFaces ? apiData.responses[0].faceAnnotations.length : 0} faces`)

    // Simple initial response
    return new Response(JSON.stringify({ 
      hasFaces,
      faceCount: hasFaces ? apiData.responses[0].faceAnnotations.length : 0,
      confidence: hasFaces ? 
        apiData.responses[0].faceAnnotations[0].detectionConfidence : 0,
      detailsRaw: isPassive ? null : apiData // Only include raw details in active mode to reduce payload size
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Generate a JWT for Google API authentication
function generateJWT(credentials: any) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials.private_key_id
  }

  const now = Math.floor(Date.now() / 1000)
  const expiryTime = now + 3600 // 1 hour

  const claimSet = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiryTime,
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  }

  const encodedHeader = btoa(JSON.stringify(header))
  const encodedClaimSet = btoa(JSON.stringify(claimSet))
  
  // Create the JWT payload
  const payload = `${encodedHeader}.${encodedClaimSet}`
  
  // Sign the JWT with the private key
  const encoder = new TextEncoder()
  const signatureInput = encoder.encode(payload)
  
  // Create a signature using the private key
  const privateKey = credentials.private_key
  
  // We need to convert PEM to a format Deno can use
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  const pemContents = privateKey.substring(
    privateKey.indexOf(pemHeader) + pemHeader.length,
    privateKey.indexOf(pemFooter)
  ).replace(/\s/g, '')
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  // Create a CryptoKey object from the PEM data
  const importedKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    importedKey,
    signatureInput
  )
  
  // Convert signature to base64
  const signatureBytes = new Uint8Array(signature)
  let base64Signature = ''
  
  for (let i = 0; i < signatureBytes.length; i++) {
    base64Signature += String.fromCharCode(signatureBytes[i])
  }
  
  const encodedSignature = btoa(base64Signature).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  
  // Return complete JWT
  return `${payload}.${encodedSignature}`
}
