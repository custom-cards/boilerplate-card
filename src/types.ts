import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'boilerplate-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

// TODO Add your configuration elements here for type-checking
export interface BoilerplateCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  show_warning?: boolean;
  show_error?: boolean;
  show_timestamps?: boolean;
  test_gui?: boolean;
  entity?: string;
  area?: string;
  icon?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  press_action?: ActionConfig;
  release_action?: ActionConfig;
  // Appearance
  card_style?: 'default' | 'compact' | 'detailed' | 'minimal';
  accent_color?: [number, number, number]; // RGB array [r, g, b]
  // Layout
  layout?: 'vertical' | 'horizontal';
  display_mode?: 'card' | 'badge';
  // Display
  attribute_limit?: number;
}
