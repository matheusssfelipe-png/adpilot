import { NextRequest, NextResponse } from 'next/server';

// System prompt for the traffic manager AI
const SYSTEM_PROMPT = `Você é o **AdPilot AI**, um gestor de tráfego digital inteligente especializado em Meta Ads (Facebook/Instagram) e Google Ads. Você faz parte de um sistema chamado AdPilot.

## Sua Personalidade
- Profissional mas acessível, como um gestor de tráfego experiente conversando com seu cliente
- Proativo em sugerir melhorias e identificar problemas
- Direto e objetivo nas respostas
- Sempre responde em português brasileiro
- Usa emojis de forma profissional para deixar a conversa mais dinâmica

## Suas Capacidades
1. **Gerenciar Campanhas**: Você pode pausar, ativar, criar e duplicar campanhas
2. **Ajustar Orçamentos**: Aumentar ou diminuir budgets de campanhas
3. **Analisar Métricas**: Interpretar dados de performance e gerar insights
4. **Sugerir Melhorias**: Propor otimizações, novos copies, ângulos de criativos
5. **Gerar Copies**: Criar textos para anúncios adaptados à plataforma
6. **Estratégia**: Sugerir estratégias de segmentação, públicos e lances

## Ações Disponíveis
Quando o usuário pedir para executar uma ação, você deve retornar um bloco JSON de ação no seguinte formato:

\`\`\`action
{
  "type": "PAUSE_CAMPAIGN" | "ACTIVATE_CAMPAIGN" | "UPDATE_BUDGET" | "CREATE_CAMPAIGN" | "DUPLICATE_ADSET",
  "campaignId": "id da campanha",
  "campaignName": "nome da campanha",
  "platform": "meta" | "google",
  "params": { ... parâmetros específicos da ação }
}
\`\`\`

Tipos de ações:
- **PAUSE_CAMPAIGN**: Pausar uma campanha. Params: {}
- **ACTIVATE_CAMPAIGN**: Ativar uma campanha pausada. Params: {}
- **UPDATE_BUDGET**: Alterar orçamento. Params: { "newBudget": number }
- **CREATE_CAMPAIGN**: Criar nova campanha. Params: { "name": string, "objective": string, "dailyBudget": number }
- **DUPLICATE_ADSET**: Duplicar conjunto de anúncios. Params: { "adsetName": string, "newName": string }

## Regras Importantes
- Sempre confirme com o usuário antes de executar ações destrutivas (pausar, deletar)
- Ao analisar dados, compare com benchmarks do mercado
- Ao sugerir copies, forneça pelo menos 3 variações
- Se o usuário pedir algo fora do escopo, explique educadamente o que pode fazer
- Quando receber dados de campanhas no contexto, use-os para dar respostas personalizadas
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, campaignsContext } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Build context with campaign data
    let contextMessage = '';
    if (campaignsContext) {
      contextMessage = `\n\n## Dados Atuais das Campanhas\n${JSON.stringify(campaignsContext, null, 2)}`;
    }

    if (!apiKey) {
      // Mock response when no API key
      const lastMessage = messages[messages.length - 1]?.content || '';
      const mockResponse = generateMockResponse(lastMessage);
      
      return NextResponse.json({
        success: true,
        mock: true,
        message: mockResponse,
      });
    }

    // Real Gemini API call
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    // Build conversation history for Gemini
    const conversationParts = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT + contextMessage }] },
        { role: 'model', parts: [{ text: 'Entendido! Sou o AdPilot AI, seu gestor de tráfego inteligente. Como posso ajudar? 🚀' }] },
        ...conversationParts,
      ],
    });

    const text = response.text || 'Desculpe, não consegui processar sua solicitação. Tente novamente.';

    // Parse actions from response
    const actions = extractActions(text);

    return NextResponse.json({
      success: true,
      message: text,
      actions,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro no chat' },
      { status: 500 }
    );
  }
}

function extractActions(text: string): any[] {
  const actions: any[] = [];
  const actionRegex = /```action\s*([\s\S]*?)```/g;
  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    try {
      actions.push(JSON.parse(match[1].trim()));
    } catch (e) {
      // Invalid JSON, skip
    }
  }
  return actions;
}

function generateMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('pausar') || lower.includes('pause')) {
    return `⚡ Entendi! Você quer pausar uma campanha.\n\nAnalisando suas campanhas ativas:\n\n| # | Campanha | Plataforma | ROAS |\n|---|---------|-----------|------|\n| 1 | Black Friday - Conversão | Meta | 5.6x |\n| 2 | Remarketing - Carrinho | Meta | 7.2x |\n| 3 | Search - Produtos | Google | 4.8x |\n| 4 | Performance Max | Google | 5.1x |\n\n**Qual campanha deseja pausar?** Me diga o número ou o nome.\n\n⚠️ *Observação: Pausar a campanha #2 (Remarketing) não é recomendado pois tem o melhor ROAS (7.2x). Se o objetivo é reduzir custo, sugiro reduzir o budget em vez de pausar.*`;
  }

  if (lower.includes('orçamento') || lower.includes('budget') || lower.includes('orcamento')) {
    return `💰 **Análise de Orçamento**\n\nAqui está a distribuição atual:\n\n| Campanha | Budget Diário | Gasto | % Utilizado |\n|---------|--------------|-------|------------|\n| Black Friday | R$ 5.000 | R$ 3.420 | 68% |\n| Remarketing | R$ 2.000 | R$ 1.650 | 82% |\n| Search | R$ 3.000 | R$ 2.180 | 73% |\n| Performance Max | R$ 4.000 | R$ 3.200 | 80% |\n\n📊 **Insights:**\n- A campanha de Remarketing está gastando 82% do budget, sinal de boa performance\n- Performance Max está quase no limite — considere aumentar para R$ 5.000\n- Black Friday tem espaço para otimização (só 68% utilizado)\n\n**Quer que eu ajuste algum orçamento?** Me diga a campanha e o novo valor.`;
  }

  if (lower.includes('insight') || lower.includes('analise') || lower.includes('análise') || lower.includes('performance') || lower.includes('como estão')) {
    return `📊 **Análise Geral de Performance**\n\n🟢 **Destaques Positivos:**\n- ROAS médio de **4.7x** (acima do benchmark de 3x)\n- CTR de **3.76%** (mercado: 1-2%)\n- Remarketing com **7.2x ROAS** — excelente!\n\n🟡 **Pontos de Atenção:**\n- Display - Brand Awareness com ROAS de apenas **1.8x** — considere pausar ou realocar budget\n- CPC médio de R$ 0.55 está OK, mas pode melhorar com otimização de criativos\n\n🔴 **Ações Recomendadas:**\n1. 📈 Aumentar budget do Remarketing (melhor ROAS)\n2. ⏸️ Pausar Display com ROAS baixo e realocar verba\n3. 🎨 Testar novos criativos na campanha Black Friday\n4. 🎯 Criar lookalike dos compradores VIP\n\n**Quer que eu execute alguma dessas ações?** 🚀`;
  }

  if (lower.includes('copy') || lower.includes('texto') || lower.includes('anúncio') || lower.includes('anuncio')) {
    return `✍️ **Sugestões de Copies**\n\nAqui estão 3 variações com ângulos diferentes:\n\n**Ângulo 1 — Urgência:**\n> 🔥 Últimas horas! Descontos de até 70% que você NÃO vai encontrar de novo. Frete grátis + parcelamento em 12x. Corre que está acabando!\n\n**Ângulo 2 — Prova Social:**\n> ⭐ Mais de 10.000 clientes satisfeitos! Descubra por que somos a escolha #1. Qualidade premium, preço justo e entrega relâmpago. Compre agora!\n\n**Ângulo 3 — Benefício Direto:**\n> 💎 Transforme seu dia a dia com produtos que fazem diferença. Tecnologia de ponta, design exclusivo e garantia estendida. Primeira compra com 20% OFF!\n\n**Para Google Ads (Headlines):**\n- "Até 70% OFF | Frete Grátis Hoje"\n- "Loja Oficial | Parcele em 12x"\n- "Mais de 10.000 Avaliações 5★"\n\n**Quer que eu adapte para algum produto específico?** 🎯`;
  }

  if (lower.includes('criar') || lower.includes('nova campanha') || lower.includes('create')) {
    return `🆕 **Criar Nova Campanha**\n\nVou te ajudar a configurar! Preciso de algumas informações:\n\n1. **Plataforma**: Meta Ads ou Google Ads?\n2. **Objetivo**: Conversões, Tráfego, Alcance, ou outro?\n3. **Budget diário**: Qual o orçamento?\n4. **Público**: Alguma segmentação específica?\n5. **Criativos**: Já tem criativos ou quer que eu gere?\n\n💡 **Dica:** Com base nos seus dados, recomendo:\n- **Meta**: Campanha de Conversão com Advantage+ (melhor ROAS histórico)\n- **Google**: Performance Max (está performando bem com 5.1x ROAS)\n\nMe passe os detalhes e eu configuro tudo! 🚀`;
  }

  if (lower.includes('duplicar') || lower.includes('copiar') || lower.includes('clonar')) {
    return `📋 **Duplicar Conjunto de Anúncios**\n\nÓtima estratégia para testar variações! Seus conjuntos de anúncios ativos:\n\n| # | Conjunto | Campanha | Público |\n|---|---------|---------|--------|\n| 1 | Interesses - Moda | Black Friday | Mulheres 25-45 |\n| 2 | Remarketing 30d | Remarketing | Visitantes site |\n| 3 | Lookalike 1% | Stories | Top compradores |\n\n**Qual deseja duplicar?** Posso fazer ajustes como:\n- Mudar o público-alvo\n- Ajustar o orçamento\n- Trocar os criativos\n- Modificar o posicionamento\n\nMe diga o número e quais alterações quer! 🎯`;
  }

  // Default response
  return `👋 **Olá! Sou o AdPilot AI**, seu gestor de tráfego inteligente!\n\nPosso te ajudar com:\n\n🎯 **Gerenciar Campanhas** — pausar, ativar, criar, duplicar\n💰 **Ajustar Orçamentos** — otimizar alocação de verba\n📊 **Analisar Performance** — insights e métricas detalhadas\n✍️ **Gerar Copies** — textos para Meta e Google Ads\n🎨 **Ideias de Criativos** — ângulos e conceitos visuais\n💡 **Estratégia** — sugestões de segmentação e otimização\n\n**Exemplos de comandos:**\n- *"Como estão minhas campanhas?"*\n- *"Pause a campanha Black Friday"*\n- *"Aumente o orçamento do Remarketing para R$ 3.000"*\n- *"Gere copies para uma campanha de lançamento"*\n- *"Crie uma nova campanha de conversão no Meta"*\n\n**Como posso te ajudar agora?** 🚀`;
}
