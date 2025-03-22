
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
      return new Response(JSON.stringify({ error: 'Authentication failed', details: tokenData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const accessToken = tokenData.access_token
    console.log('Successfully obtained access token');

    // Prepare Vision API request - we'll use a lower quality setting to improve performance
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
          ],
          imageContext: {
            // Increase likelihood of detecting faces by optimizing for face photos
            faceRecognitionParams: {
              // Use a slightly higher confidence threshold to reduce false positives
              // but not so high that we miss actual faces
              confidenceThreshold: 0.6
            }
          }
        }
      ]
    }

    // Call Vision API
    console.log('Calling Vision API...');
    const apiResponse = await fetch(visionApiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const apiData = await apiResponse.json()
    
    if (!apiResponse.ok) {
      console.error('Vision API error:', apiData);
      return new Response(JSON.stringify({ 
        error: 'Vision API error', 
        details: apiData,
        success: false,
        hasFaces: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Process the response
    const hasFaces = apiData?.responses?.[0]?.faceAnnotations?.length > 0
    const faceCount = hasFaces ? apiData.responses[0].faceAnnotations.length : 0
    const confidence = hasFaces ? 
      apiData.responses[0].faceAnnotations[0].detectionConfidence : 0

    console.log(`Vision API detected ${faceCount} faces with confidence: ${confidence}`);

    // Enhanced response
    return new Response(JSON.stringify({ 
      success: true,
      hasFaces,
      faceCount,
      confidence,
      detailsRaw: isPassive ? null : apiData, // Only include raw details in active mode to reduce payload size
      message: hasFaces 
        ? `Detected ${faceCount} face(s) with confidence ${confidence.toFixed(2)}`
        : 'No face detected in frame'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(JSON.stringify({ 
      error: error.message, 
      success: false,
      hasFaces: false
    }), {
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
  const importedKey = crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )
  
  return importedKey.then(key => {
    return crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      key,
      signatureInput
    ).then(signature => {
      // Convert signature to base64
      const signatureBytes = new Uint8Array(signature)
      let base64Signature = ''
      
      for (let i = 0; i < signatureBytes.length; i++) {
        base64Signature += String.fromCharCode(signatureBytes[i])
      }
      
      const encodedSignature = btoa(base64Signature).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      
      // Return complete JWT
      return `${payload}.${encodedSignature}`
    })
  })
}
