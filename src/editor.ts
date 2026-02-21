/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor, ActionConfig } from 'custom-card-helpers';

import { BoilerplateCardConfig } from './types';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('boilerplate-card-editor')
export class BoilerplateCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: BoilerplateCardConfig;

  @state() private _helpers?: any;

  constructor() {
    super();
  }

  private _configValueTarget(
    ev: Event,
  ): (EventTarget & { configValue?: keyof BoilerplateCardConfig; value?: string; checked?: boolean }) | null {
    return ev.target as EventTarget & {
      configValue?: keyof BoilerplateCardConfig;
      value?: string;
      checked?: boolean;
    };
  }

  public setConfig(config: BoilerplateCardConfig): void {
    // Deep clone and ensure proper action defaults
    this._config = {
      ...JSON.parse(JSON.stringify(config)),
      // Initialize actions with proper defaults if not set
      tap_action: config.tap_action || { action: 'toggle' },
      hold_action: config.hold_action || { action: 'more-info' },
      double_tap_action: config.double_tap_action || { action: 'none' },
      // Appearance defaults
      card_style: config.card_style || 'default',
      // Display defaults
      show_timestamps: config.show_timestamps ?? true,
      attribute_limit: config.attribute_limit ?? 3,
    };
    this.loadCardHelpers();
    this.requestUpdate();
  }

  protected shouldUpdate(): boolean {
    return true;
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._config) {
      return html`<div>Loading...</div>`;
    }

    // You can restrict on domain type
    const entities = Object.keys(this.hass.states);

    return html`
      <ha-select
        .hass=${this.hass}
        label="Entity (Required)"
        .value=${this._config?.entity || ''}
        .configValue=${'entity'}
        required="true"
        @change=${this._valueChanged}
        @closed=${(ev: Event) => ev.stopPropagation()}
      >
        ${entities.map((entity) => html` <mwc-list-item .value=${entity}>${entity}</mwc-list-item> `)}
      </ha-select>
      <ha-area-picker
        .curValue=${this._config?.area || ''}
        no-add
        .hass=${this.hass}
        .value=${this._config?.area || ''}
        .configValue=${'area'}
        label="Area to display"
        @value-changed=${this._valueChanged}
      >
      </ha-area-picker>
      <ha-textfield
        label="Name (Optional)"
        .value=${this._config?.name || ''}
        .configValue=${'name'}
        @input=${this._valueChanged}
      ></ha-textfield>
      <ha-icon-picker
        .hass=${this.hass}
        .value=${this._config?.icon || ''}
        .configValue=${'icon'}
        label="Icon (Optional)"
        @value-changed=${this._valueChanged}
      ></ha-icon-picker>
      <ha-formfield label="Show Warning">
        <ha-switch
          .checked=${this._config?.show_warning ?? false}
          .configValue=${'show_warning'}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      <ha-formfield label="Show Error">
        <ha-switch
          .checked=${this._config?.show_error ?? false}
          .configValue=${'show_error'}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>

      <div class="action-header">
        <h3>Actions Configuration</h3>
        <p>Configure different interaction behaviors</p>
      </div>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ ui_action: {} }}
        .value=${this._config.tap_action}
        label="Tap Action"
        .configValue=${'tap_action'}
        @value-changed=${this._actionChanged}
      ></ha-selector>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ ui_action: {} }}
        .value=${this._config.hold_action}
        label="Hold Action"
        .configValue=${'hold_action'}
        @value-changed=${this._actionChanged}
      ></ha-selector>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ ui_action: {} }}
        .value=${this._config.double_tap_action}
        label="Double Tap Action"
        .configValue=${'double_tap_action'}
        @value-changed=${this._actionChanged}
      ></ha-selector>

      <div class="section-header">
        <h3>Appearance</h3>
      </div>

      <ha-selector
        .hass=${this.hass}
        .selector=${{
          select: {
            options: [
              { value: 'default', label: 'Default' },
              { value: 'compact', label: 'Compact — condensed spacing' },
              { value: 'detailed', label: 'Detailed — larger text & icons' },
              { value: 'minimal', label: 'Minimal — entity row only' },
            ],
            mode: 'list',
          },
        }}
        .value=${this._config.card_style || 'default'}
        label="Card Style"
        .configValue=${'card_style'}
        @value-changed=${this._selectorChanged}
      ></ha-selector>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ color_rgb: {} }}
        .value=${this._config.accent_color || null}
        label="Accent Color"
        .configValue=${'accent_color'}
        @value-changed=${this._selectorChanged}
      ></ha-selector>

      <div class="section-header">
        <h3>Display</h3>
      </div>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ number: { min: 0, max: 10, step: 1, mode: 'box' } }}
        .value=${this._config.attribute_limit ?? 3}
        label="Attribute Limit"
        .configValue=${'attribute_limit'}
        @value-changed=${this._selectorChanged}
      ></ha-selector>

      <ha-formfield label="Show Timestamps">
        <ha-switch
          .checked=${this._config?.show_timestamps ?? true}
          .configValue=${'show_timestamps'}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
    `;
  }

  private _valueChanged(ev: Event): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = this._configValueTarget(ev);
    if (!target?.configValue) {
      return;
    }

    const newValue = target.checked !== undefined ? target.checked : target.value;
    if (this._config[target.configValue] === newValue) {
      return;
    }

    if (target.value === '') {
      const tmpConfig = { ...this._config };
      delete tmpConfig[target.configValue];
      this._config = tmpConfig;
    } else {
      this._config = {
        ...this._config,
        [target.configValue]: newValue,
      };
    }

    fireEvent(this, 'config-changed', { config: this._config });
    this.requestUpdate();
  }

  private _selectorChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target as any;
    const configValue = target.configValue as keyof BoilerplateCardConfig;
    if (!configValue) {
      return;
    }
    this._config = {
      ...this._config,
      [configValue]: ev.detail.value,
    };
    fireEvent(this, 'config-changed', { config: this._config });
    this.requestUpdate();
  }

  private _actionChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass) {
      return;
    }

    const target = ev.target as any;
    const configValue = target.configValue;

    if (!configValue) {
      return;
    }

    const newAction = ev.detail.value as ActionConfig;

    // Create a clean copy without undefined values
    const updatedConfig = { ...this._config };

    // Handle action updates - ensure we always have a valid action object
    if (newAction && newAction.action) {
      updatedConfig[configValue as keyof BoilerplateCardConfig] = newAction;
    } else {
      // Set appropriate default if action is cleared/invalid
      const defaults = {
        tap_action: { action: 'toggle' },
        hold_action: { action: 'more-info' },
        double_tap_action: { action: 'none' },
      };
      updatedConfig[configValue as keyof BoilerplateCardConfig] = defaults[configValue as keyof typeof defaults] || {
        action: 'none',
      };
    }

    this._config = updatedConfig;

    fireEvent(this, 'config-changed', { config: this._config });
    this.requestUpdate();
  }

  private async loadCardHelpers(): Promise<void> {
    try {
      this._helpers = await (window as any).loadCardHelpers();
    } catch (e) {
      // Card helpers failed to load, continue without them
      console.warn('Failed to load card helpers:', e);
    }
  }

  static get styles() {
    return [
      css`
        ha-select,
        ha-textfield,
        ha-icon-picker,
        ha-formfield,
        ha-selector {
          margin-bottom: 16px;
          display: block;
        }
        ha-formfield {
          padding: 16px 0;
        }
        .action-header {
          margin: 24px 0 16px 0;
          padding: 16px 0 0 0;
          border-top: 1px solid var(--divider-color);
        }
        .action-header h3 {
          margin: 0 0 8px 0;
          color: var(--primary-text-color);
          font-size: 16px;
          font-weight: 500;
        }
        .action-header p {
          margin: 0;
          color: var(--secondary-text-color);
          font-size: 14px;
        }
        .section-header {
          margin: 24px 0 12px 0;
          padding: 16px 0 0 0;
          border-top: 1px solid var(--divider-color);
        }
        .section-header h3 {
          margin: 0;
          color: var(--primary-text-color);
          font-size: 16px;
          font-weight: 500;
        }
      `,
    ];
  }
}

// Explicit element registration as fallback
if (!customElements.get('boilerplate-card-editor')) {
  customElements.define('boilerplate-card-editor', BoilerplateCardEditor);
}
