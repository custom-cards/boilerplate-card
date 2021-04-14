import { ActionConfig, EntityConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'extended-banner-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

// TODO Add your configuration elements here for type-checking
export interface ExtendedBannerCardConfig extends LovelaceCardConfig {
  type: string;
  header?: any;
  show_warning?: boolean;
  show_error?: boolean;
  debug?: boolean;
  rowSize?: number;
  test_gui?: boolean;
  color?: string;
  entities: ExtendedBannerCardEntityConfig[];
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface ExtendedBannerCardEntityConfig extends EntityConfig {
  domain: any;
  attribute?: any;
  error?: any;
  toggle?: boolean;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  size?: number;
}
