// services/goldService.ts

export interface GoldQuote {
  price: number;
  source?: string;
  sourceTitle?: string;
}

export const goldService = {
  async getCurrentPrice(): Promise<GoldQuote> {
    // MOCK TEMPORÁRIO (SEM API)
    return {
      price: 345.67,
      source: 'https://mock.local',
      sourceTitle: 'Valor Mockado'
    };
  }
};