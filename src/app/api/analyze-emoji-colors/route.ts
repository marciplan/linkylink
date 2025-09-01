import { NextRequest, NextResponse } from 'next/server'
import { rateLimitHeaders } from '@/lib/rate-limit'
import { chatCompletion, parseJsonFromModel } from '@/lib/openai'

interface ColorAnalysis {
  dominantColor: string
  secondaryColors: string[]
  suggestedThemes: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { emoji } = await request.json()

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 })
    }

    console.log('🔍 ANALYZING EMOJI COLORS FOR:', emoji)

    // Basic rate limit: 20 req/min per IP for this endpoint
    const rl = rateLimitHeaders(request, 'analyze-emoji-colors', 20, 60_000)
    if (!rl.allowed) {
      return NextResponse.json(rl.body, { status: rl.status, headers: rl.headers })
    }
    const rateHeaders = rl.headers

    // Create a simple canvas representation of the emoji for GPT-4o-mini to analyze
    // We'll send the emoji as text and ask GPT to analyze its visual colors
    try {
      const completion = await chatCompletion({
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing emoji colors and mapping them to design themes. 

When given an emoji, analyze its visual appearance and identify:
1. The dominant color (most prominent color in the emoji)
2. 2-3 secondary colors that appear in the emoji
3. 3-4 suitable design themes based on these colors

Available themes to choose from:
- warm sunset (oranges, reds, yellows)
- ocean depths (deep blues, teals)
- forest morning (greens, browns)
- cosmic purple (purples, magentas)
- pink dawn (pinks, light purples)
- golden hour (golds, warm yellows)
- electric blue (bright blues, cyans)
- neon lights (bright colors, electric tones)
- professional (grays, blues, muted tones)
- earth tones (browns, beiges, natural colors)
- deep ocean (dark blues, navy)

Return your response as JSON:
{
  "dominantColor": "#FF6B42",
  "secondaryColors": ["#4ECDC4", "#45B7D1"],
  "suggestedThemes": ["warm sunset", "ocean depths", "professional"]
}`
          },
          {
            role: 'user',
            content: `Analyze the colors in this emoji: ${emoji}

Look at its visual appearance and identify the dominant color and secondary colors, then suggest matching themes.`
            }
          ],
          max_tokens: 200,
          temperature: 0.3,
      })

      if (completion.ok) {
        const aiResponse = completion.content || ''
        
        try {
          console.log('🤖 RAW COLOR ANALYSIS:', aiResponse)
          
          const analysis = parseJsonFromModel(aiResponse) as ColorAnalysis
          
          console.log('🎨 COLOR ANALYSIS RESULTS:')
          console.log(`  Dominant: ${analysis.dominantColor}`)
          console.log(`  Secondary: ${analysis.secondaryColors?.join(', ')}`)
          console.log(`  Themes: ${analysis.suggestedThemes?.join(', ')}`)
          
          return NextResponse.json({
            emoji,
            dominantColor: analysis.dominantColor,
            secondaryColors: analysis.secondaryColors || [],
            suggestedThemes: analysis.suggestedThemes || ['warm sunset', 'professional', 'electric blue'],
            source: 'ai'
          }, { headers: rateHeaders })
          
        } catch (parseError) {
          console.error('❌ ERROR PARSING COLOR ANALYSIS:', parseError)
          console.log('🤖 RAW RESPONSE:', aiResponse)
        }
      } else {
        console.error('❌ OPENAI API ERROR:', completion.error)
      }
    } catch (error) {
      console.error('❌ ERROR CALLING OPENAI:', error)
    }

    // Fallback color analysis based on common emoji patterns
    const fallbackAnalysis = getFallbackColorAnalysis(emoji)
    console.log('🔄 USING FALLBACK COLOR ANALYSIS:', fallbackAnalysis)
    
    return NextResponse.json({
      emoji,
      ...fallbackAnalysis,
      source: 'fallback'
    }, { headers: rateHeaders })

  } catch (error) {
    console.error('Analyze emoji colors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getFallbackColorAnalysis(emoji: string) {
  const emojiColorMap: Record<string, { dominantColor: string, secondaryColors: string[], suggestedThemes: string[] }> = {
    // Nature/Green emojis
    '🌲': { dominantColor: '#228B22', secondaryColors: ['#8B4513', '#654321'], suggestedThemes: ['forest morning', 'earth tones', 'professional'] },
    '🌳': { dominantColor: '#32CD32', secondaryColors: ['#8B4513', '#654321'], suggestedThemes: ['forest morning', 'earth tones', 'professional'] },
    '🌿': { dominantColor: '#90EE90', secondaryColors: ['#228B22', '#8B4513'], suggestedThemes: ['forest morning', 'earth tones', 'professional'] },
    '🏡': { dominantColor: '#FF6347', secondaryColors: ['#8B4513', '#32CD32'], suggestedThemes: ['warm sunset', 'earth tones', 'forest morning'] },
    '🌼': { dominantColor: '#FFD700', secondaryColors: ['#FFFF00', '#FFA500'], suggestedThemes: ['golden hour', 'warm sunset', 'professional'] },
    '🌞': { dominantColor: '#FFD700', secondaryColors: ['#FFA500', '#FF4500'], suggestedThemes: ['golden hour', 'warm sunset', 'electric blue'] },
    
    // Blue emojis
    '💙': { dominantColor: '#0000FF', secondaryColors: ['#4169E1', '#1E90FF'], suggestedThemes: ['ocean depths', 'deep ocean', 'electric blue'] },
    '🌊': { dominantColor: '#00CED1', secondaryColors: ['#4682B4', '#0000FF'], suggestedThemes: ['ocean depths', 'deep ocean', 'electric blue'] },
    
    // Purple emojis
    '💜': { dominantColor: '#8A2BE2', secondaryColors: ['#9932CC', '#DA70D6'], suggestedThemes: ['cosmic purple', 'neon lights', 'pink dawn'] },
    
    // Red/Pink emojis
    '❤️': { dominantColor: '#FF0000', secondaryColors: ['#DC143C', '#B22222'], suggestedThemes: ['pink dawn', 'warm sunset', 'cosmic purple'] },
    
    // Tech emojis
    '💻': { dominantColor: '#708090', secondaryColors: ['#2F4F4F', '#4682B4'], suggestedThemes: ['professional', 'electric blue', 'deep ocean'] },
    '🚀': { dominantColor: '#C0C0C0', secondaryColors: ['#FF4500', '#0000FF'], suggestedThemes: ['electric blue', 'professional', 'cosmic purple'] },
    
    // Default
    'default': { dominantColor: '#FF6B42', secondaryColors: ['#4ECDC4', '#45B7D1'], suggestedThemes: ['warm sunset', 'professional', 'electric blue'] }
  }
  
  return emojiColorMap[emoji] || emojiColorMap['default']
}
