/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor, ActionConfig } from 'custom-card-helpers';

import { BoilerplateCardConfig } from './types';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('boilerplate-card-editor')
export class BoilerplateCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: BoilerplateCardConfig;

  @state() private _openSection = 'entity';

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
      ...structuredClone(config),
      // Initialize actions with proper defaults if not set
      tap_action: config.tap_action || { action: 'more-info' },
      hold_action: config.hold_action || { action: 'none' },
      double_tap_action: config.double_tap_action || { action: 'none' },
      // Appearance defaults
      card_style: config.card_style || 'default',
      layout: config.layout || 'vertical',
      display_mode: config.display_mode || 'card',
      // Display defaults
      show_timestamps: config.show_timestamps ?? true,
      attribute_limit: config.attribute_limit ?? 3,
    };
    this.requestUpdate();
  }

  protected shouldUpdate(): boolean {
    return true;
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._config) {
      return html`<div>Loading...</div>`;
    }

    const entities = Object.keys(this.hass.states);

    return html`
      ${this._renderSection(
        'entity',
        'Entity',
        html`
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
          ></ha-area-picker>
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
        `,
      )}
      ${this._renderSection(
        'actions',
        'Actions',
        html`
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
        `,
      )}
      ${this._renderSection(
        'appearance',
        'Appearance',
        html`
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
          <ha-selector
            .hass=${this.hass}
            .selector=${{
              select: {
                options: [
                  { value: 'vertical', label: 'Vertical — stacked (default)' },
                  { value: 'horizontal', label: 'Horizontal — icon, info & actions in one row' },
                ],
                mode: 'list',
              },
            }}
            .value=${this._config.layout || 'vertical'}
            label="Layout"
            .configValue=${'layout'}
            @value-changed=${this._selectorChanged}
          ></ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{
              select: {
                options: [
                  { value: 'card', label: 'Card — full ha-card with header' },
                  { value: 'badge', label: 'Badge — compact inline chip' },
                ],
                mode: 'list',
              },
            }}
            .value=${this._config.display_mode || 'card'}
            label="Display Mode"
            .configValue=${'display_mode'}
            @value-changed=${this._selectorChanged}
          ></ha-selector>
        `,
      )}
      ${this._renderSection(
        'display',
        'Display',
        html`
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: 0, max: 10, step: 1, mode: 'slider' } }}
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
        `,
      )}
    `;
  }

  private _toggleSection(ev: Event, id: string): void {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    this._openSection = this._openSection === id ? '' : id;
    this.requestUpdate();
  }

  private _renderSection(id: string, title: string, content: TemplateResult): TemplateResult {
    const isOpen = this._openSection === id;
    return html`
      <div class="accordion ${isOpen ? 'accordion--open' : ''}">
        <button
          type="button"
          class="accordion__header"
          @click=${(ev: Event) => this._toggleSection(ev, id)}
          aria-expanded=${isOpen}
        >
          <span>${title}</span>
          <ha-icon icon=${isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}></ha-icon>
        </button>
        <div class="accordion__body">
          <div class="accordion__content">${content}</div>
        </div>
      </div>
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
        tap_action: { action: 'more-info' },
        hold_action: { action: 'none' },
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

  static get styles() {
    return [
      css`
        /* ── Controls inside accordion bodies ── */
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

        /* ── Accordion ── */
        .accordion {
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          margin-bottom: 8px;
          overflow: hidden;
        }
        .accordion__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 16px;
          background: var(--secondary-background-color);
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--primary-text-color);
          text-align: left;
          transition: background 0.15s ease;
        }
        .accordion__header:hover {
          background: var(--divider-color);
        }
        .accordion--open .accordion__header {
          border-bottom: 1px solid var(--divider-color);
        }
        /* Collapse/expand body with max-height transition */
        .accordion__body {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.25s ease;
        }
        .accordion--open .accordion__body {
          grid-template-rows: 1fr;
        }
        .accordion__content {
          overflow: hidden;
          padding: 0 16px;
        }
        .accordion--open .accordion__content {
          padding: 16px;
        }
      `,
    ];
  }
}

// Explicit element registration as fallback
if (!customElements.get('boilerplate-card-editor')) {
  customElements.define('boilerplate-card-editor', BoilerplateCardEditor);
}
