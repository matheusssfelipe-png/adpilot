import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { textType, product, audience, context } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return mock response
      const mockTexts: Record<string, string[]> = {
        'meta-primary': [
          `🔥 ${product || 'Nossos produtos'} com descontos imperdíveis! ${context || 'Aproveite agora'} — Frete grátis para todo o Brasil. Compre pelo link!`,
          `✨ Descubra por que milhares de pessoas escolhem ${product || 'nossa marca'}. Qualidade garantida + ${context || 'ofertas exclusivas'}. Não perca!`,
          `💎 ${audience || 'Você'} merece o melhor! ${product || 'Seleção especial'} com condições únicas. ${context || 'Parcele em até 12x sem juros'}.`,
          `🎯 Transforme seu dia a dia com ${product || 'nossos produtos'}. ${context || 'Promoção por tempo limitado'}. Clique e confira!`,
        ],
        'meta-headline': [
          `${product || 'Oferta Exclusiva'} | Até 70% OFF`,
          `Descubra ${product || 'o Melhor'} Para Você`,
          `${context || 'Promoção'} Imperdível | ${product || 'Compre Agora'}`,
          `Últimas Unidades! ${product || 'Garanta o Seu'}`,
        ],
        'google-headline': [
          `${product || 'Compre Online'} com Desconto | Frete Grátis`,
          `${product || 'Ofertas'} Exclusivas | Parcele 12x`,
          `${context || 'Promoção'} ${product || 'Imperdível'} | Site Oficial`,
          `${product || 'Os Melhores Preços'} Estão Aqui`,
        ],
        'google-description': [
          `Encontre ${product || 'os melhores produtos'} com os melhores preços. ${context || 'Frete grátis'} para todo o Brasil. Compre online com segurança.`,
          `${product || 'Qualidade premium'} ao melhor preço do mercado. ${context || 'Descontos exclusivos'}. Entrega rápida e troca fácil. Confira!`,
          `${audience || 'Descubra'} por que somos a escolha #1 em ${product || 'nosso segmento'}. ${context || 'Satisfação garantida ou seu dinheiro de volta'}.`,
          `${product || 'Seleção especial'} para ${audience || 'você'}. ${context || 'Condições exclusivas por tempo limitado'}. Acesse agora!`,
        ],
      };

      return NextResponse.json({
        success: true,
        mock: true,
        texts: mockTexts[textType] || mockTexts['meta-primary'],
        message: 'Usando dados mockados — configure GEMINI_API_KEY para gerar textos reais'
      });
    }

    // Real Gemini API call
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const typeDescriptions: Record<string, string> = {
      'meta-primary': 'texto primário para anúncio no Facebook/Instagram (máximo 125 caracteres ideais, pode ser maior)',
      'meta-headline': 'título curto e impactante para anúncio no Facebook/Instagram (máximo 40 caracteres)',
      'google-headline': 'headline para Google Ads Search (máximo 30 caracteres cada)',
      'google-description': 'descrição para Google Ads Search (máximo 90 caracteres cada)',
    };

    const prompt = `Você é um copywriter expert em anúncios digitais. Gere 4 variações de ${typeDescriptions[textType] || 'texto para anúncio'}.

Produto/Serviço: ${product}
Público-alvo: ${audience}
Contexto/Oferta: ${context}

Regras:
- Use linguagem persuasiva em português brasileiro
- Inclua CTA (call to action) quando apropriado
- Use emojis de forma estratégica (para Meta Ads)
- Mantenha o limite de caracteres adequado
- Cada variação deve ter um ângulo diferente

Retorne APENAS as 4 variações, uma por linha, sem numeração.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const texts = text.split('\n').filter((line: string) => line.trim().length > 0).slice(0, 4);

    return NextResponse.json({
      success: true,
      texts: texts.length > 0 ? texts : ['Erro ao gerar textos. Tente novamente.'],
    });
  } catch (error: any) {
    console.error('Text generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao gerar texto' },
      { status: 500 }
    );
  }
}
