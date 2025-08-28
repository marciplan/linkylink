import { NextRequest, NextResponse } from 'next/server'

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

    // Create a simple canvas representation of the emoji for GPT-4o-mini to analyze
    // We'll send the emoji as text and ask GPT to analyze its visual colors
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
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
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const aiResponse = data.choices[0]?.message?.content || ''
        
        try {
          console.log('🤖 RAW COLOR ANALYSIS:', aiResponse)
          
          const analysis = JSON.parse(aiResponse) as ColorAnalysis
          
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
          })
          
        } catch (parseError) {
          console.error('❌ ERROR PARSING COLOR ANALYSIS:', parseError)
          console.log('🤖 RAW RESPONSE:', aiResponse)
        }
      } else {
        const errorText = await response.text()
        console.error('❌ OPENAI API ERROR:', response.status, response.statusText)
        console.error('Error details:', errorText)
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
    })

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