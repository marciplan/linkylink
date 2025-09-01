import { NextRequest, NextResponse } from 'next/server'
import { rateLimitHeaders } from '@/lib/rate-limit'
import { chatCompletion, parseJsonFromModel, getOpenAIKey } from '@/lib/openai'

interface EmojiSuggestion {
  emoji: string
  confidence: number
}

interface AIResponse {
  suggestions: EmojiSuggestion[]
}

export async function POST(request: NextRequest) {
  try {
    const { title, subtitle } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    console.log('🎭 EMOJI SUGGESTION REQUEST')
    console.log('Title:', title)
    console.log('Subtitle:', subtitle || 'None')
    console.log('---')

    // Rate limit public endpoint: 30 req/min per IP
    const rl = rateLimitHeaders(request, 'suggest-emojis', 30, 60_000)
    if (!rl.allowed) {
      return NextResponse.json(rl.body, { status: rl.status, headers: rl.headers })
    }
    const rateHeaders = rl.headers

    // Generate emoji suggestions with confidence scoring using OpenAI
    try {
      if (!getOpenAIKey()) {
        console.warn('⚠️  No OpenAI API key configured. Using fallback emojis.')
        throw new Error('Missing OpenAI API key')
      }
      const completion = await chatCompletion({
        messages: [
          {
            role: 'system',
            content: `You are an expert at suggesting relevant emojis with confidence scoring. Based on the given title and subtitle (which may be in Dutch or English), suggest exactly 5 relevant emojis that would work well as an icon/avatar.

Return your response as a JSON object with this exact format:
{
  "suggestions": [
    {"emoji": "🎯", "confidence": 85},
    {"emoji": "📊", "confidence": 75},
    {"emoji": "💼", "confidence": 60},
    {"emoji": "🚀", "confidence": 45},
    {"emoji": "⭐", "confidence": 40}
  ]
}

Confidence scoring:
- 90-100: Perfect match, clearly represents the content
- 70-89: Very relevant, strong connection to theme
- 50-69: Relevant, good connection to theme
- 30-49: Somewhat relevant, loose connection
- 0-29: Weak relevance, generic connection

Focus on emojis that represent the theme, mood, or content type. The first emoji should be the most relevant with highest confidence. You understand both Dutch and English words and can suggest appropriate emojis for either language.`
          },
          {
            role: 'user',
            content: `Title: "${title}"${subtitle ? `\nSubtitle: "${subtitle}"` : ''}`
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      })

      if (completion.ok) {
        const aiResponse = completion.content || ''
        
        try {
          // Try to parse the JSON response from GPT
          console.log('🤖 RAW AI RESPONSE:', aiResponse)
          
          const parsedResponse = parseJsonFromModel(aiResponse) as AIResponse
          const suggestions = parsedResponse.suggestions || []
          
          console.log('📊 PARSED SUGGESTIONS:')
          suggestions.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.emoji} - ${s.confidence}% confidence`)
          })
          
          // Check confidence thresholds
          const validSuggestions = suggestions.filter((s: EmojiSuggestion) => s.emoji && s.confidence)
          const firstConfidence = validSuggestions[0]?.confidence || 0
          
          // If first emoji is above 70% confidence and at least 3 others are above 50%
          const highConfidenceSuggestions = validSuggestions.filter((s: EmojiSuggestion) => s.confidence >= 50)
          
          console.log('🎯 CONFIDENCE ANALYSIS:')
          console.log(`  First emoji confidence: ${firstConfidence}%`)
          console.log(`  High confidence (50%+) count: ${highConfidenceSuggestions.length}/5`)
          console.log(`  Threshold check: First ≥ 70% (${firstConfidence >= 70}) AND High count ≥ 3 (${highConfidenceSuggestions.length >= 3})`)
          
          if (firstConfidence >= 70 && highConfidenceSuggestions.length >= 3) {
            // Use AI suggestions
            const emojis = validSuggestions.slice(0, 5).map((s: EmojiSuggestion) => s.emoji)
            // Pad with popular emojis if needed
            const popularEmojis = ['📱', '💻', '🌟', '🎯', '🚀', '💡', '📈', '🎨', '🎵', '📝']
            while (emojis.length < 5) {
              const nextPopular = popularEmojis.find(e => !emojis.includes(e))
              if (nextPopular) emojis.push(nextPopular)
              else break
            }
            
            console.log('✅ USING AI SUGGESTIONS:', emojis)
            console.log('---')
            return NextResponse.json({ 
              emojis: emojis.slice(0, 5),
              source: 'ai',
              confidence: firstConfidence 
            }, { headers: rateHeaders })
          } else {
            console.log('❌ AI CONFIDENCE TOO LOW - Will use fallback')
          }
        } catch (parseError) {
          console.error('❌ ERROR PARSING AI RESPONSE:', parseError)
          console.log('🤖 RAW AI RESPONSE:', aiResponse)
          console.log('📝 Expected JSON format: {"suggestions": [{"emoji": "🎯", "confidence": 85}]}')
        }
      } else {
        console.error('❌ OPENAI API ERROR:', completion.error)
      }
    } catch (error) {
      console.error('❌ ERROR CALLING OPENAI:', error)
    }

    // Fallback to most popular emojis when AI confidence is low or API fails
    // These are the 5 most commonly used emojis that work well as profile icons
    const popularFallbackEmojis = ['😊', '🌟', '🎯', '💡', '🚀']
    
    console.log('🔄 USING POPULAR FALLBACK EMOJIS:', popularFallbackEmojis)
    console.log('📈 Reason: AI confidence too low or API failed')
    console.log('---')
    
    return NextResponse.json({ 
      emojis: popularFallbackEmojis,
      source: 'fallback',
      confidence: 0 
    }, { headers: rateHeaders })

  } catch (error) {
    console.error('Suggest emojis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
