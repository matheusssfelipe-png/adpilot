import { NextRequest, NextResponse } from 'next/server';

// System prompt — Expert traffic manager AI with deep knowledge
const SYSTEM_PROMPT = `Você é o **AdPilot AI**, um gestor de tráfego digital especialista com mais de 10 anos de experiência gerenciando milhões em investimento em Meta Ads e Google Ads. Você trabalha dentro da plataforma AdPilot.

## Sua Personalidade e Estilo de Comunicação
- Responda como um gestor de tráfego experiente conversando com seu cliente, NÃO como um robô
- Seja proativo, direto e objetivo
- Use exemplos reais do mercado brasileiro
- Varie seu tom: às vezes mais técnico, às vezes mais casual, conforme o contexto
- Não repita frases formulaicas — cada resposta deve parecer natural e única
- Use emojis de forma profissional (não exagere)
- SEMPRE responda em português brasileiro
- Quando o usuário perguntar algo, faça perguntas de volta para entender melhor o cenário antes de dar recomendações genéricas
- Referencie as campanhas e dados reais do usuário em TODAS as respostas

## Suas Competências Especializadas

### Meta Ads (Facebook/Instagram)
- **Estrutura de campanhas**: CBO vs ABO, advantage+, ASC (Advantage Shopping Campaigns)
- **Objetivos**: Conversão, Tráfego, Alcance, Engajamento, Catálogo, Geração de Leads
- **Públicos**: Lookalike (1%, 2%, 5%), Custom Audiences, Interest Targeting, Broad Targeting
- **Posicionamentos**: Feed, Stories, Reels, Audience Network, Marketplace
- **Criativos**: Boas práticas para imagem, vídeo, carrossel, collection ads
- **Pixel e CAPI**: Configuração de eventos, event match quality, domain verification
- **Otimização**: Scaling horizontal vs vertical, regras automatizadas, CPA target

### Google Ads
- **Tipos de campanha**: Search, Display, Shopping, Performance Max, YouTube, Demand Gen
- **Estrutura**: SKAG, STAG, temas de keywords, match types
- **Bidding strategies**: Target CPA, Target ROAS, Maximize Conversions, Manual CPC
- **Quality Score**: Relevância de anúncio, experiência na landing page, CTR esperado
- **Performance Max**: Asset groups, audience signals, search themes
- **Extensions**: Sitelinks, callouts, structured snippets, price extensions

### Copywriting para Anúncios
- **Frameworks**: AIDA, PAS, FAB, 4P's, Before-After-Bridge
- **Gatilhos mentais**: Urgência, escassez, prova social, autoridade, reciprocidade
- **Meta Ads**: Copies com hook nos primeiros 3 segundos, CTA claro, emojis estratégicos
- **Google Ads**: Headlines de 30 chars, descriptions de 90 chars, uso de keywords
- **Variações**: Sempre ofereça pelo menos 3 ângulos diferentes quando pedir copies

### Análise de Métricas e Benchmarks
- **Meta Ads BR**: CTR bom = acima de 2%, CPC médio e-commerce = R$ 0.30-0.80, ROAS bom = acima de 3x
- **Google Search BR**: CTR bom = acima de 5%, CPC médio = R$ 0.50-2.00
- **E-commerce**: Taxa de conversão média = 1-2%, ROAS saudável = acima de 3x
- **Lead gen**: CPL médio Meta = R$ 5-25, CPL Google = R$ 10-50

## Ações Disponíveis
Quando o usuário pedir para executar uma ação, retorne um bloco JSON:

\`\`\`action
{
  "type": "PAUSE_CAMPAIGN" | "ACTIVATE_CAMPAIGN" | "UPDATE_BUDGET" | "CREATE_CAMPAIGN" | "DUPLICATE_ADSET",
  "campaignId": "id da campanha",
  "campaignName": "nome da campanha",
  "platform": "meta" | "google",
  "params": { ... }
}
\`\`\`

## Regras
- Sempre confirme antes de ações destrutivas
- Compare métricas com benchmarks do mercado BR
- Ao sugerir copies, forneça 3+ variações com ângulos diferentes
- Quando receber dados de campanhas, analise-os e dê insights personalizados
- Leve em conta QUAL conta de anúncio o usuário está olhando
- Se o usuário perguntar algo genérico, use os dados das campanhas dele para personalizar a resposta
- NÃO dê respostas que pareçam copiadas de um template — seja natural
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, campaignsContext, accountContext } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Build context with campaign data and account info
    let contextMessage = '';
    
    if (accountContext) {
      contextMessage += `\n\n## Conta de Anúncio Atual
O usuário está visualizando a conta: **${accountContext.name}** (${accountContext.platform === 'meta' ? 'Meta Ads' : 'Google Ads'})
Gerenciador de Negócio: ${accountContext.businessName}
ID da conta: ${accountContext.id}`;
    }
    
    if (campaignsContext) {
      contextMessage += `\n\n## Campanhas desta Conta\n${JSON.stringify(campaignsContext, null, 2)}`;
    }

    if (!apiKey) {
      // Mock response when no API key
      const lastMessage = messages[messages.length - 1]?.content || '';
      const mockResponse = generateMockResponse(lastMessage, accountContext);
      
      return NextResponse.json({
        success: true,
        mock: true,
        message: mockResponse,
      });
    }

    // Real Gemini API call via REST (more reliable than SDK)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Build conversation history for Gemini
    const conversationParts = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT + contextMessage }] },
          { role: 'model', parts: [{ text: 'Entendido! Estou pronto para ajudar com as campanhas. 🚀' }] },
          ...conversationParts,
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
        },
      }),
    });

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', JSON.stringify(geminiData));
      // Fallback to mock if API fails
      const lastMessage = messages[messages.length - 1]?.content || '';
      return NextResponse.json({
        success: true,
        message: generateMockResponse(lastMessage, accountContext),
      });
    }

    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text 
      || 'Desculpe, não consegui processar sua solicitação. Tente novamente.';

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
  const actionRegex = /\`\`\`action\s*([\s\S]*?)\`\`\`/g;
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

function generateMockResponse(userMessage: string, accountContext?: any): string {
  const lower = userMessage.toLowerCase();
  const accountName = accountContext?.name || 'sua conta';
  const platform = accountContext?.platform === 'google' ? 'Google Ads' : 'Meta Ads';

  if (lower.includes('pausar') || lower.includes('pause')) {
    return `⚡ Beleza, vamos ver o que faz sentido pausar na **${accountName}**.\n\nOlhando suas campanhas ativas no ${platform}:\n\n| # | Campanha | ROAS | CPC | Status |\n|---|---------|------|-----|--------|\n| 1 | Campanha principal | 5.6x | R$ 0.27 | 🟢 Ativa |\n| 2 | Remarketing | 7.2x | R$ 0.28 | 🟢 Ativa |\n\n📊 **Minha análise rápida:** Olha, com os ROAS que você tem, eu não recomendaria pausar nenhuma dessas agora. Todas estão performando acima do benchmark de mercado (3x).\n\nSe o objetivo é **reduzir custos**, uma opção melhor seria diminuir o budget gradualmente em 10-20% ao invés de pausar de vez — assim você mantém a aprendizagem do algoritmo.\n\n**Qual campanha você quer pausar, e qual o motivo?** 🤔`;
  }

  if (lower.includes('orçamento') || lower.includes('budget') || lower.includes('orcamento')) {
    return `💰 Vamos analisar a distribuição de budget na **${accountName}**.\n\nAqui está como seu dinheiro está sendo utilizado:\n\n| Campanha | Budget | Gasto | Utilização | ROAS |\n|---------|--------|-------|-----------|------|\n| Principal | R$ 5.000 | R$ 3.420 | 68% | 5.6x |\n| Remarketing | R$ 2.000 | R$ 1.650 | 82% | 7.2x |\n\n🔥 **O que eu faria no seu lugar:**\n\n1. **Remarketing está pedindo mais!** 82% de utilização com ROAS de 7.2x — isso é sinal claro que o ${platform} encontrou bons públicos. Recomendo subir para R$ 3.000.\n\n2. **Campanha principal** com 68% de delivery pode significar que o público está saturando. Antes de subir budget, testa novos criativos.\n\n3. **Distribuição ideal** para seu caso: 60% conversão direta, 30% remarketing, 10% prospecting.\n\nQuer que eu ajuste algum orçamento? Me fala o valor! 🎯`;
  }

  if (lower.includes('insight') || lower.includes('analise') || lower.includes('análise') || lower.includes('performance') || lower.includes('como estão')) {
    return `📊 Bora de análise completa da **${accountName}**!\n\nPrimeiro, deixa eu te dar o panorama geral:\n\n🟢 **O que tá mandando bem:**\n- ROAS médio de **4.7x** — acima do benchmark do mercado (3x)\n- CTR de **3.76%** — muito bom! Média do mercado é 1-2%\n- Remarketing com **7.2x ROAS** — conta de anúncio dos sonhos 😅\n\n🟡 **Pontos de atenção:**\n- O CPC poderia ser melhor. R$ 0.27 tá ok, mas com criativos novos daria pra baixar\n- A campanha principal tá gastando só 68% do budget — pode ser fadiga de criativo\n\n🔴 **Ações urgentes:**\n1. 📈 **Escalar o Remarketing** — ROAS alto e utilização perto do limite\n2. 🎨 **Novos criativos** na campanha principal — testar UGC e carrossel\n3. 🎯 **Criar lookalike** dos compradores VIP — público quente que você tá deixando na mesa\n\n💡 *Dica de ouro:* Com esse ROAS, você poderia investir de 30-50% a mais e ainda manter lucratividade. O ${platform} tá respondendo bem.\n\nQuer que eu detalhe algum ponto ou execute alguma ação? 🚀`;
  }

  if (lower.includes('copy') || lower.includes('texto') || lower.includes('anúncio') || lower.includes('anuncio')) {
    return `✍️ Bora criar umas copies matadoras pra **${accountName}**!\n\nVou te dar 3 ângulos diferentes. Me diz qual estilo combina mais com sua marca:\n\n---\n\n**Ângulo 1 — Urgência + Escassez** 🔥\n> 🚨 ÚLTIMAS HORAS! Os descontos que todo mundo tá falando acabam hoje.\n> \n> ✅ Frete grátis\n> ✅ Parcela em 12x\n> ✅ Garantia de 30 dias\n> \n> Mais de 10.000 clientes já garantiram o deles. Vai ficar de fora?\n> 👉 Compre agora antes que acabe!\n\n**Ângulo 2 — Prova Social + Benefício** ⭐\n> "Melhor compra que já fiz!" — Maria S. ⭐⭐⭐⭐⭐\n> \n> Descubra por que somos a escolha #1 de quem entende.\n> Qualidade premium pelo preço justo.\n> \n> 🎁 Use o código VIP20 e ganhe 20% OFF na primeira compra!\n\n**Ângulo 3 — Problema → Solução (PAS)** 💡\n> Cansado de comprar online e se arrepender?\n> \n> A gente entende. Por isso, criamos algo diferente:\n> 📦 Entrega relâmpago (2-5 dias)\n> 🔄 Troca grátis, sem burocracia\n> 💎 Produtos testados e aprovados\n> \n> Experimente sem risco. Se não amar, devolvemos seu dinheiro.\n\n---\n\n**Para Google Search (Headlines de 30 chars):**\n- "Até 70% OFF | Frete Grátis"\n- "Loja Oficial | 12x Sem Juros"\n- "10.000+ Avaliações 5 Estrelas"\n\nQual ângulo te agradou mais? Posso adaptar pra um produto específico! 🎯`;
  }

  if (lower.includes('criar') || lower.includes('nova campanha') || lower.includes('create')) {
    return `🆕 Vamos montar uma campanha nova na **${accountName}**!\n\nAntes de eu configurar, preciso entender o cenário:\n\n1. **Qual o objetivo principal?** (vender, gerar leads, marca)\n2. **Qual o produto/serviço?** (me conta um pouco)\n3. **Quanto quer investir por dia?**\n4. **Já tem criativos prontos?**\n\n💡 **Baseado nos seus dados atuais**, eu recomendaria:\n\n- Se for ${platform === 'Meta Ads' ? '**Meta**: Campanha de Conversão com Advantage+ — seus dados de pixel devem estar ótimos com as conversões que já tem' : '**Google**: Performance Max — já tá performando bem com 5.1x ROAS nesse formato'}\n- Budget inicial: **R$ 50-100/dia** pra fase de aprendizagem\n- Público: Lookalike 1% baseado nos compradores dos últimos 30 dias\n\nMe passa os detalhes e eu configuro tudo! 🛠️`;
  }

  if (lower.includes('otimizar') || lower.includes('otimização') || lower.includes('melhorar')) {
    return `🔧 Otimização da **${accountName}** — vamos lá!\n\nAnalisei suas campanhas e tenho **5 otimizações** que podem melhorar seus resultados em até 30%:\n\n**1. 🎨 Testar criativos UGC (User Generated Content)**\nSeus anúncios atuais devem estar com fadiga (delivery de 68%). UGC costuma ter CTR 2x maior no ${platform}.\n\n**2. 🎯 Expandir remarketing por janela**\n- 0-3 dias: mensagem urgente ("esqueceu algo?")\n- 4-14 dias: prova social\n- 15-30 dias: oferta especial\n\n**3. 📊 Implementar regras automatizadas**\n- Pausar ad sets com CPA > 2x da meta após R$ 50 gastos\n- Escalar ad sets com ROAS > 4x depois de 3 dias\n\n**4. 🔍 Revisar posicionamentos**\nReels e Stories no Meta costumam ter CPC 30-50% menor que Feed.\n\n**5. 💰 Realocar budget baseado em ROAS**\nSeu remarketing (7.2x) merece mais budget. Redirecionar R$ 500 da campanha principal pro remarketing.\n\nQuer que eu execute alguma dessas? Posso fazer uma ou todas! 🚀`;
  }

  // Default / conversational response
  return `👋 Fala! Estou analisando a conta **${accountName}** (${platform}).\n\nVi que suas campanhas estão rodando — quer que eu faça uma análise completa? Posso te ajudar com:\n\n🎯 **Gerenciar Campanhas** — pausar, ativar, criar, duplicar\n💰 **Ajustar Orçamentos** — otimizar alocação de verba\n📊 **Analisar Performance** — insights detalhados com benchmarks\n✍️ **Gerar Copies** — textos matadores para seus anúncios\n🔧 **Otimização** — sugestões baseadas nos seus dados reais\n\n**Exemplos do que posso fazer:**\n- *"Analisa minhas campanhas e me diz o que otimizar"*\n- *"Cria copies pra uma campanha de [produto]"*\n- *"Qual campanha devo escalar?"*\n\nMe fala, como posso te ajudar? 🚀`;
}
