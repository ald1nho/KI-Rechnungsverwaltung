
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Edge function called with method:', req.method)
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64 } = await req.json()
    
    if (!imageBase64) {
      throw new Error('No file provided')
    }

    let processedImageBase64 = imageBase64;
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured')
      throw new Error('OpenAI API key not configured')
    }

    console.log('Making request to OpenAI API')
    
    // First try with vision model
    let response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analysiere diese Rechnung sorgfältig und extrahiere alle wichtigen Informationen. Achte besonders auf:

1. GESAMTBETRAG: Suche nach dem Endbetrag, Gesamtbetrag oder "Zu zahlen" - das ist der wichtigste Wert
2. ANBIETER: Name des Geschäfts, Restaurants, Dienstleisters
3. DATUM: Das Rechnungsdatum (nicht das Druckdatum)
4. KATEGORIE: Bestimme basierend auf dem Inhalt eine der folgenden Kategorien:
   - restaurant: Restaurants, Cafés, Bars, Essen, Getränke, Lebensmittel
   - transport: Taxi, ÖPNV, Tankstelle, Mietwagen, Flüge, Bahn
   - office: Büromaterial, Software, Arbeitsplatz-Equipment, Drucker
   - electronics: Computer, Smartphones, Elektronik, Technik, Geräte
   - licenses: Software-Lizenzen, SaaS-Abonnements, Digital-Lizenzen
   - other: Alles andere

5. BESCHREIBUNG: Liste die wichtigsten Artikel oder Dienstleistungen auf

Antworte NUR mit diesem JSON-Format, keine Erklärungen:
{
  "vendor": "Name des Anbieters",
  "amount": Zahl (nur die Zahl, ohne Währungssymbol),
  "date": "YYYY-MM-DD",
  "category": "eine der 6 Kategorien",
  "description": "Kurze Beschreibung der Artikel/Dienstleistungen",
  "confidence": Zahl zwischen 0 und 1
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${processedImageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    })

    console.log('OpenAI API response status:', response.status)
    
    // If 403, try without vision (fallback)
    if (response.status === 403) {
      console.log('Vision API failed, trying text-only fallback')
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Da ich das Bild nicht analysieren kann, erstelle bitte ein Beispiel-Analyseergebnis für eine Rechnung im JSON-Format:
              {
                "vendor": "Beispiel Restaurant",
                "amount": "25.50",
                "date": "${new Date().toISOString().split('T')[0]}",
                "category": "restaurant",
                "description": "Rechnung konnte nicht automatisch analysiert werden",
                "confidence": "0.1"
              }
              
              Antworte nur mit dem JSON-Objekt.`
            }
          ],
          max_tokens: 200,
          temperature: 0.1
        }),
      })
      console.log('Fallback API response status:', response.status)
    }

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      
      // If both vision and fallback fail, return manual entry prompt
      if (response.status === 403) {
        console.log('Both API calls failed, returning manual entry fallback')
        return new Response(
          JSON.stringify({ 
            success: true, 
            analysis: {
              vendor: 'Manuell eingeben',
              amount: 0,
              date: new Date().toISOString().split('T')[0],
              category: 'other',
              description: 'OpenAI API nicht verfügbar - bitte manuell eingeben',
              confidence: 0
            }
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
      
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('OpenAI response received')
    
    const content = data.choices[0]?.message?.content

    if (!content) {
      console.error('No content in OpenAI response')
      throw new Error('No content in OpenAI response')
    }

    // Parse JSON response from OpenAI
    let analysisResult
    try {
      analysisResult = JSON.parse(content)
      console.log('Successfully parsed OpenAI response')
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e)
      // If JSON parsing fails, create a fallback response
      analysisResult = {
        vendor: 'Unbekannt',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'other',
        description: 'Analyse konnte nicht vollständig durchgeführt werden',
        confidence: 0.3
      }
    }

    console.log('Returning successful response')
    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: analysisResult 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error analyzing receipt:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        analysis: {
          vendor: 'Fehler bei der Analyse',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          category: 'other',
          description: 'KI-Analyse fehlgeschlagen',
          confidence: 0
        }
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
