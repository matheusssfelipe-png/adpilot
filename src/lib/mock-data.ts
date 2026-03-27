// Mock data for development — will be replaced with real API data
export const mockKPIs = {
  totalSpend: { value: 'R$ 24.850', change: '+12.5%', positive: true },
  impressions: { value: '1.2M', change: '+8.3%', positive: true },
  clicks: { value: '45.2K', change: '+15.1%', positive: true },
  ctr: { value: '3.76%', change: '+0.4%', positive: true },
  cpc: { value: 'R$ 0.55', change: '-8.2%', positive: true },
  conversions: { value: '1.847', change: '+22.3%', positive: true },
  roas: { value: '4.2x', change: '+0.8x', positive: true },
  cpa: { value: 'R$ 13.45', change: '-5.1%', positive: true },
};

export const mockChartData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2026, 2, i + 1).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  meta: Math.floor(Math.random() * 500 + 300),
  google: Math.floor(Math.random() * 400 + 200),
  impressions: Math.floor(Math.random() * 50000 + 20000),
  clicks: Math.floor(Math.random() * 2000 + 800),
}));

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'ERROR';
export type Platform = 'meta' | 'google';

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  status: CampaignStatus;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  roas: number;
  objective: string;
  startDate: string;
  endDate?: string;
}

export const mockCampaigns: Campaign[] = [
  {
    id: 'meta-1',
    name: 'Black Friday - Conversão',
    platform: 'meta',
    status: 'ACTIVE',
    budget: 5000,
    spend: 3420,
    impressions: 280000,
    clicks: 12500,
    ctr: 4.46,
    cpc: 0.27,
    conversions: 480,
    roas: 5.6,
    objective: 'Conversões',
    startDate: '2026-03-01',
  },
  {
    id: 'meta-2',
    name: 'Remarketing - Carrinho Abandonado',
    platform: 'meta',
    status: 'ACTIVE',
    budget: 2000,
    spend: 1650,
    impressions: 95000,
    clicks: 5800,
    ctr: 6.1,
    cpc: 0.28,
    conversions: 220,
    roas: 7.2,
    objective: 'Conversões',
    startDate: '2026-03-05',
  },
  {
    id: 'google-1',
    name: 'Search - Produtos Principais',
    platform: 'google',
    status: 'ACTIVE',
    budget: 3000,
    spend: 2180,
    impressions: 150000,
    clicks: 8900,
    ctr: 5.93,
    cpc: 0.24,
    conversions: 310,
    roas: 4.8,
    objective: 'Search',
    startDate: '2026-02-20',
  },
  {
    id: 'google-2',
    name: 'Display - Brand Awareness',
    platform: 'google',
    status: 'PAUSED',
    budget: 1500,
    spend: 890,
    impressions: 420000,
    clicks: 3200,
    ctr: 0.76,
    cpc: 0.28,
    conversions: 45,
    roas: 1.8,
    objective: 'Display',
    startDate: '2026-02-15',
  },
  {
    id: 'meta-3',
    name: 'Stories - Lançamento Produto',
    platform: 'meta',
    status: 'PAUSED',
    budget: 2500,
    spend: 1100,
    impressions: 180000,
    clicks: 7200,
    ctr: 4.0,
    cpc: 0.15,
    conversions: 150,
    roas: 3.5,
    objective: 'Alcance',
    startDate: '2026-03-10',
  },
  {
    id: 'google-3',
    name: 'Performance Max - E-commerce',
    platform: 'google',
    status: 'ACTIVE',
    budget: 4000,
    spend: 3200,
    impressions: 520000,
    clicks: 15600,
    ctr: 3.0,
    cpc: 0.21,
    conversions: 520,
    roas: 5.1,
    objective: 'Performance Max',
    startDate: '2026-02-28',
  },
  {
    id: 'meta-4',
    name: 'Lookalike - Compradores VIP',
    platform: 'meta',
    status: 'DRAFT',
    budget: 3000,
    spend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    conversions: 0,
    roas: 0,
    objective: 'Conversões',
    startDate: '2026-03-25',
  },
];

export interface Creative {
  id: string;
  name: string;
  type: 'image' | 'text';
  platform: Platform;
  status: 'active' | 'draft';
  preview?: string;
  headline?: string;
  description?: string;
  ctr?: number;
  impressions?: number;
  createdAt: string;
}

export const mockCreatives: Creative[] = [
  {
    id: 'c1',
    name: 'Banner Black Friday 1080x1080',
    type: 'image',
    platform: 'meta',
    status: 'active',
    headline: 'Até 70% OFF na Black Friday!',
    description: 'Aproveite as melhores ofertas do ano. Frete grátis acima de R$99.',
    ctr: 5.2,
    impressions: 85000,
    createdAt: '2026-03-15',
  },
  {
    id: 'c2',
    name: 'Headline Pack - Search',
    type: 'text',
    platform: 'google',
    status: 'active',
    headline: 'Compre Agora com Desconto | Frete Grátis | Até 70% OFF',
    description: 'As melhores ofertas estão aqui. Produtos selecionados com desconto exclusivo.',
    ctr: 6.8,
    impressions: 120000,
    createdAt: '2026-03-12',
  },
  {
    id: 'c3',
    name: 'Carrossel Produtos Top',
    type: 'image',
    platform: 'meta',
    status: 'active',
    headline: 'Descubra nossos mais vendidos',
    description: 'Confira os produtos favoritos dos nossos clientes.',
    ctr: 4.1,
    impressions: 62000,
    createdAt: '2026-03-18',
  },
];
