import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { title, subtitle } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate emoji suggestions using OpenAI
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at suggesting relevant emojis. Based on the given title and subtitle (which may be in Dutch or English), suggest exactly 5 relevant emojis that would work well as an icon/avatar. Return ONLY the emojis separated by spaces, no explanations or other text. Focus on emojis that represent the theme, mood, or content type. The first emoji should be the most relevant. You understand both Dutch and English words and can suggest appropriate emojis for either language.'
            },
            {
              role: 'user',
              content: `Title: "${title}"${subtitle ? `\nSubtitle: "${subtitle}"` : ''}`
            }
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const emojiString = data.choices[0]?.message?.content || '📝 💼 🌟 🎯 🚀'
        
        // Better emoji parsing - split by spaces and clean each emoji
        const parsedEmojis = emojiString.trim()
          .split(/\s+/)
          .map((emoji: string) => emoji.match(/\p{Emoji}/u)?.[0]) // Extract first valid emoji from each part
          .filter(Boolean) // Remove null/undefined values
          .slice(0, 5)
        
        // Ensure we always have exactly 5 emojis by padding with fallbacks if needed
        const fallbackEmojis = ['📝', '💼', '🌟', '🎯', '🚀']
        while (parsedEmojis.length < 5) {
          const nextFallback = fallbackEmojis[parsedEmojis.length]
          if (!parsedEmojis.includes(nextFallback)) {
            parsedEmojis.push(nextFallback)
          } else {
            parsedEmojis.push(fallbackEmojis[Math.floor(Math.random() * fallbackEmojis.length)])
          }
        }
        
        const emojis = parsedEmojis.slice(0, 5)
        return NextResponse.json({ emojis })
      } else {
        console.error('OpenAI API error:', await response.text())
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error)
    }

    // Fallback emojis if OpenAI fails
    const fallbackEmojis = ['📝', '💼', '🌟', '🎯', '🚀']
    
    return NextResponse.json({ emojis: fallbackEmojis })

  } catch (error) {
    console.error('Suggest emojis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}