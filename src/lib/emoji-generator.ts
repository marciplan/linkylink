interface EmojiSuggestion {
  emoji: string
  confidence: number
}

interface AIResponse {
  suggestions: EmojiSuggestion[]
}

export async function generateEmojiSuggestions(title: string, subtitle?: string | null): Promise<string[]> {
  try {
    console.log('🎭 GENERATING EMOJI SUGGESTIONS')
    console.log('Title:', title)
    console.log('Subtitle:', subtitle || 'None')

    // Generate emoji suggestions with confidence scoring using OpenAI
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
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const aiResponse = data.choices[0]?.message?.content || ''
        
        try {
          console.log('🤖 RAW AI RESPONSE:', aiResponse)
          
          const parsedResponse = JSON.parse(aiResponse) as AIResponse
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
            return emojis.slice(0, 5)
          } else {
            console.log('❌ AI CONFIDENCE TOO LOW - Will use fallback')
          }
        } catch (parseError) {
          console.error('❌ ERROR PARSING AI RESPONSE:', parseError)
          console.log('🤖 RAW AI RESPONSE:', aiResponse)
        }
      } else {
        const errorText = await response.text()
        console.error('❌ OPENAI API ERROR:', response.status, response.statusText)
        console.error('Error details:', errorText)
      }
    } catch (error) {
      console.error('❌ ERROR CALLING OPENAI:', error)
    }

    // Fallback to most popular emojis when AI confidence is low or API fails
    const popularFallbackEmojis = ['😊', '🌟', '🎯', '💡', '🚀']
    
    console.log('🔄 USING POPULAR FALLBACK EMOJIS:', popularFallbackEmojis)
    console.log('📈 Reason: AI confidence too low or API failed')
    
    return popularFallbackEmojis
  } catch (error) {
    console.error('Generate emoji suggestions error:', error)
    return ['😊', '🌟', '🎯', '💡', '🚀'] // Ultimate fallback
  }
}