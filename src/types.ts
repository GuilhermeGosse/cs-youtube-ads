export interface AggregatedCampaign {
    id: string;
    name: string;
    type: string;
    clicks: number;
    impressions: number;
    reach?: number;
    ctr: number;
    avgCpc: number;
    cost: number;
    conversions: number;
    costPerConversion: number;
  }

  export interface DailyCampaignEntry {
    id: string;
    name: string;
    type: string;
    clicks: number;
    impressions: number;
    reach?: number;
    ctr: number;
    avgCpc: number;
    cost: number;
    conversions: number;
    costPerConversion: number;
    date: string;
  }
