export interface SalesMixField {
  key: string;
  label: string;
  hasCustomLabel?: boolean;
}

export const SALES_MIX_FIELDS: SalesMixField[] = [
  { key: 'sales_mix_food', label: 'Food' },
  { key: 'sales_mix_liquor', label: 'Liquor' },
  { key: 'sales_mix_wine', label: 'Wine' },
  { key: 'sales_mix_beer', label: 'Beer' },
  { key: 'sales_mix_na_bev', label: 'NA Beverages' },
  { key: 'sales_mix_retail', label: 'Retail/Merch' },
  { key: 'sales_mix_room_fees', label: 'Room Fees' }
];

export const getSalesMixFieldKeys = () => SALES_MIX_FIELDS.map(f => f.key);
