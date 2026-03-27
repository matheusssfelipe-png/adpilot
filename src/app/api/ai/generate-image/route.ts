import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style, format } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return mock response when no API key is configured
      return NextResponse.json({
        success: true,
        mock: true,
        images: [
          `https://placehold.co/${format === '1080x1920' ? '1080x1920' : format === '1200x628' ? '1200x628' : '1080x1080'}/1a1a2e/6366f1?text=AI+Generated+1`,
          `https://placehold.co/${format === '1080x1920' ? '1080x1920' : format === '1200x628' ? '1200x628' : '1080x1080'}/1a1a2e/8b5cf6?text=AI+Generated+2`,
        ],
        message: 'Usando dados mockados — configure GEMINI_API_KEY para gerar imagens reais'
      });
    }

    // Real Gemini API call using @google/genai
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const fullPrompt = `Create a professional ad creative image: ${prompt}. Style: ${style}. The image should be high quality, suitable for digital advertising on social media.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: fullPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Extract image from response
    const images: string[] = [];
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      images: images.length > 0 ? images : ['https://placehold.co/1080x1080/1a1a2e/6366f1?text=Generated'],
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao gerar imagem' },
      { status: 500 }
    );
  }
}
