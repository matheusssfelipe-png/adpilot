'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { FiImage, FiType, FiZap, FiDownload, FiCopy, FiRefreshCw, FiCheck } from 'react-icons/fi';

type GenerationType = 'image' | 'text';

const imageStyles = [
  'Profissional e moderno',
  'Vibrante e colorido',
  'Minimalista e limpo',
  'Luxuoso e premium',
  'Divertido e casual',
  'Tecnológico e futurista',
];

const textTypes = [
  { value: 'meta-primary', label: 'Texto Primário (Meta)' },
  { value: 'meta-headline', label: 'Título (Meta)' },
  { value: 'google-headline', label: 'Headlines (Google Ads)' },
  { value: 'google-description', label: 'Descrições (Google Ads)' },
];

export default function CreativesPage() {
  const [type, setType] = useState<GenerationType>('image');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(imageStyles[0]);
  const [textType, setTextType] = useState('meta-primary');
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedTexts, setGeneratedTexts] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate API call — will connect to Gemini Nano Banana
    await new Promise(r => setTimeout(r, 2000));

    if (type === 'image') {
      setGeneratedImages([
        'https://placehold.co/1080x1080/1a1a2e/6366f1?text=Creative+1&font=inter',
        'https://placehold.co/1080x1080/1a1a2e/8b5cf6?text=Creative+2&font=inter',
        'https://placehold.co/1080x1080/1a1a2e/3b82f6?text=Creative+3&font=inter',
        'https://placehold.co/1080x1080/1a1a2e/22c55e?text=Creative+4&font=inter',
      ]);
    } else {
      const mockTexts = [
        '🔥 Transforme seu estilo com nossa nova coleção! Peças exclusivas com até 50% OFF. Não perca — estoque limitado. Compre agora e ganhe frete grátis!',
        '✨ Descubra o segredo dos nossos clientes mais satisfeitos. Produtos premium com qualidade garantida. Aproveite: primeira compra com 20% de desconto!',
        '🎯 Você merece o melhor! Nossa seleção especial está te esperando. Entrega rápida, troca fácil e preço justo. Clique e confira as ofertas do dia.',
        '💎 Exclusivo para você: nossa coleção mais vendida agora com condições especiais. Parcele em até 12x sem juros. Compre online com total segurança!',
      ];
      setGeneratedTexts(mockTexts);
    }
    setGenerating(false);
  };

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <>
      <Header title="Criativos IA" subtitle="Gere imagens e textos com Nano Banana" />
      <div className="page-content">
        {/* Type Selector */}
        <div className="tabs" style={{ marginBottom: 'var(--space-xl)' }}>
          <button className={`tab ${type === 'image' ? 'active' : ''}`} onClick={() => setType('image')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiImage size={14} /> Gerar Imagem</span>
          </button>
          <button className={`tab ${type === 'text' ? 'active' : ''}`} onClick={() => setType('text')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiType size={14} /> Gerar Texto</span>
          </button>
        </div>

        <div className="grid-2">
          {/* Form */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
              {type === 'image' ? '🎨 Configurar Imagem' : '✍️ Configurar Texto'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {type === 'image' ? (
                <>
                  <div className="input-group">
                    <label className="input-label">Descreva o criativo</label>
                    <textarea
                      className="input"
                      placeholder="Ex: Banner para Black Friday com um smartphone, fundo escuro com luzes neon, texto '50% OFF'"
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Estilo Visual</label>
                    <select className="input" value={style} onChange={e => setStyle(e.target.value)}>
                      {imageStyles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">Formato</label>
                      <select className="input">
                        <option>1080x1080 (Feed)</option>
                        <option>1080x1920 (Stories)</option>
                        <option>1200x628 (Landscape)</option>
                        <option>1080x1350 (Retrato)</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Quantidade</label>
                      <select className="input">
                        <option>4 variações</option>
                        <option>2 variações</option>
                        <option>1 imagem</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label className="input-label">Tipo de Texto</label>
                    <select className="input" value={textType} onChange={e => setTextType(e.target.value)}>
                      {textTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Produto / Serviço</label>
                    <input
                      className="input"
                      placeholder="Ex: Loja de roupas femininas online"
                      value={product}
                      onChange={e => setProduct(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Público-alvo</label>
                    <input
                      className="input"
                      placeholder="Ex: Mulheres 25-45 anos, classe A/B"
                      value={audience}
                      onChange={e => setAudience(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Contexto / Oferta</label>
                    <textarea
                      className="input"
                      placeholder="Ex: Promoção de Black Friday, 50% OFF em toda a loja, frete grátis"
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}

              <button
                className="btn btn-primary btn-lg w-full"
                onClick={handleGenerate}
                disabled={generating}
                style={{ marginTop: 'var(--space-sm)' }}
              >
                {generating ? (
                  <><div className="spinner" /> Gerando...</>
                ) : (
                  <><FiZap /> Gerar com IA</>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
              📋 Resultados
            </h3>

            {type === 'image' && generatedImages.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
                {generatedImages.map((img, i) => (
                  <div key={i} className="creative-card">
                    <div className="creative-card-image">
                      <img src={img} alt={`Creative ${i + 1}`} />
                    </div>
                    <div className="creative-card-body" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <button className="btn btn-sm btn-secondary w-full">
                        <FiDownload size={12} /> Baixar
                      </button>
                      <button className="btn btn-sm btn-primary w-full">
                        Usar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : type === 'text' && generatedTexts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {generatedTexts.map((text, i) => (
                  <div key={i} style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 'var(--space-sm)' }}>{text}</p>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => copyText(text, i)}>
                        {copiedIdx === i ? <><FiCheck size={12} /> Copiado!</> : <><FiCopy size={12} /> Copiar</>}
                      </button>
                    </div>
                  </div>
                ))}
                <button className="btn btn-secondary w-full" onClick={handleGenerate}>
                  <FiRefreshCw size={14} /> Gerar novas variações
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">{type === 'image' ? '🎨' : '✍️'}</div>
                <p className="empty-state-text">
                  {type === 'image' ? 'Nenhuma imagem gerada ainda' : 'Nenhum texto gerado ainda'}
                </p>
                <p className="text-sm text-secondary">
                  Preencha as configurações e clique em &quot;Gerar com IA&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
