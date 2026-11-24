export type AssetInfo = { path: string; width?: number; height?: number; mode?: string };

export type Product = {
  product_id: string;
  row: number;
  brand: 'Apple' | 'Samsung' | string;
  series: string;
  model: string;
  storage: string;
  color: string;
  part_number: string;
  price: number;
  price_raw: string;
  display_order: number;
  color_hex: string;
  condition: string;
  note: string;
  assets: { front?: AssetInfo; back?: AssetInfo; model3d?: AssetInfo; video?: AssetInfo };
};

export type Settings = {
  update_date: string;
  currency: string;
  price_unit: 'thousand_toman' | 'toman';
  reel_duration: number;
  fps: number;
  resolution: string;
  brand_name: string;
  instagram_username: string;
  background_music: string;
  show_part_number: boolean;
  show_color: boolean;
  show_storage: boolean;
  allow_placeholders: boolean;
};

export type Issue = { level: 'error' | 'warning' | 'info'; code: string; product_id: string | null; row: number | null; message: string };

export type Validated = {
  source: string;
  validated_at: string;
  settings: Settings;
  products: Product[];
  rejected: (Product & { errors: string[] })[];
  inactive: { product_id: string; row: number; model: string }[];
  issues: Issue[];
  stats: Record<string, unknown> & { active_valid: number; missing_images: number; invalid_prices: number; errors: number; warnings: number; brands: string[] };
  ok: boolean;
};

/** One model + storage + part-number family shown as a single showcase scene. */
export type Group = {
  key: string;
  brand: string;
  series: string;
  model: string;
  storage: string;
  part_number: string;
  condition: string;
  variants: Product[];
  from: number; // frame offset inside the reel
  durationInFrames: number;
};

export type Reel = {
  part: number;
  parts: number;
  durationInFrames: number;
  fps: number;
  intro: number;
  outro: number;
  groups: Group[];
};

export type ReelProps = { reel: Reel; settings: Settings; preview?: boolean };

export type Cue = { t: number; type: 'logo' | 'enter' | 'rotate' | 'sweep' | 'price' | 'transition' | 'signature' | 'glitch'; group?: number };
