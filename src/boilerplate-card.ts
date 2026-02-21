import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HassEntity } from 'home-assistant-js-websocket';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  computeIcon,
  computeName,
  computeState,
  formatTimestamp,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers
import type { BoilerplateCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

console.info(
  `%c  BOILERPLATE-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
interface WindowWithCustomCards extends Window {
  customCards: Array<{ type: string; name: string; description: string }>;
}

(window as unknown as WindowWithCustomCards).customCards =
  (window as unknown as WindowWithCustomCards).customCards || [];
(window as unknown as WindowWithCustomCards).customCards.push({
  type: 'boilerplate-card',
  name: 'Boilerplate Card',
  description: 'A template custom card for you to create something awesome',
});

// TODO Name your custom element
@customElement('boilerplate-card')
export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    try {
      await import('./editor');
      const element = document.createElement('boilerplate-card-editor');
      return element;
    } catch (error) {
      console.error('Failed to load editor:', error);
      throw error;
    }
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: BoilerplateCardConfig;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: BoilerplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    this.config = {
      name: 'Boilerplate',
      ...config,
    };
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }

    const stateObj = this.config.entity ? this.hass.states[this.config.entity] : undefined;

    if (!this.config.entity) {
      return this._showError('No entity defined');
    }

    if (!stateObj) {
      return this._showError(`Entity not found: ${this.config.entity}`);
    }

    // Log action handler configuration
    const actionHandlerConfig = {
      hasHold: hasAction(this.config.hold_action),
      hasDoubleClick: hasAction(this.config.double_tap_action),
      repeat: (this.config.hold_action as any)?.repeat,
      repeatLimit: (this.config.hold_action as any)?.repeat_limit,
      isMomentary: !!(this.config.press_action || this.config.release_action),
      disableKbd: false,
    };

    return html`
      <ha-card
        .header=${this.config.name}
        @action=${this._handleAction}
        ${actionHandler(actionHandlerConfig)}
        .config=${this.config}
        tabindex="0"
        .label=${`Boilerplate: ${this.config.entity}`}
        class="clickable-card"
      >
        <div class="card-content">
          <div class="entity-row clickable-row" @click=${this._handleEntityClick}>
            <div class="icon">
              <ha-icon .icon=${computeIcon(stateObj, this.config.icon)}></ha-icon>
            </div>
            <div class="entity-info">
              <div class="name">${computeName(stateObj)}</div>
              <div class="state">${computeState(stateObj)}</div>
            </div>
            <div class="entity-actions">
              <div class="toggle-hint">Tap to toggle</div>
            </div>
          </div>

          ${this._renderAttributes(stateObj)} ${this._renderActionButtons(stateObj)}

          <div class="timestamps">
            <div class="last-changed"><strong>Last Changed:</strong> ${formatTimestamp(stateObj.last_changed)}</div>
            <div class="last-updated"><strong>Last Updated:</strong> ${formatTimestamp(stateObj.last_updated)}</div>
          </div>
        </div>
        <ha-ripple
          .disabled=${!hasAction(this.config.tap_action) &&
          !hasAction(this.config.hold_action) &&
          !hasAction(this.config.double_tap_action)}
        ></ha-ripple>
      </ha-card>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _handleEntityClick(ev: Event): void {
    ev.stopPropagation();
    if (!this.config.entity || !this.hass) return;

    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) return;

    // Demonstrate entity toggle functionality
    const domain = stateObj.entity_id.split('.')[0];

    switch (domain) {
      case 'light':
      case 'switch':
      case 'fan':
        this._callService(domain, 'toggle', { entity_id: this.config.entity });
        break;
      case 'cover': {
        const coverState = stateObj.state;
        const service = coverState === 'open' ? 'close_cover' : 'open_cover';
        this._callService('cover', service, { entity_id: this.config.entity });
        break;
      }
      case 'lock': {
        const lockState = stateObj.state;
        const lockService = lockState === 'locked' ? 'unlock' : 'lock';
        this._callService('lock', lockService, { entity_id: this.config.entity });
        break;
      }
      default:
        // For other entities, show more info
        this._showMoreInfo(this.config.entity);
    }
  }

  private _callService(domain: string, service: string, serviceData: Record<string, unknown>): void {
    this.hass.callService(domain, service, serviceData);
  }

  private _showMoreInfo(entityId: string): void {
    const event = new Event('hass-more-info', {
      bubbles: true,
      composed: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event as any).detail = { entityId };
    this.dispatchEvent(event);
  }

  private _navigate(path: string): void {
    window.history.pushState(null, '', path);
    const event = new Event('location-changed', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  private _showWarning(warning: string): TemplateResult {
    return html` <hui-warning>${warning}</hui-warning> `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html` ${errorCard} `;
  }

  private _renderAttributes(stateObj: HassEntity): TemplateResult {
    const importantAttrs = ['battery_level', 'temperature', 'humidity', 'brightness', 'volume_level'];
    const attrs = Object.entries(stateObj.attributes)
      .filter(([key, _]) => importantAttrs.includes(key))
      .slice(0, 3); // Limit to 3 attributes

    if (attrs.length === 0) {
      return html``;
    }

    return html`
      <div class="attributes">
        <strong>Attributes:</strong>
        ${attrs.map(
          ([key, value]) => html`
            <div class="attribute">
              <span class="attr-key">${key.replace(/_/g, ' ')}:</span>
              <span class="attr-value">${value}</span>
            </div>
          `,
        )}
      </div>
    `;
  }

  private _renderActionButtons(stateObj: HassEntity): TemplateResult {
    return html`
      <div class="action-buttons">
        <div class="action-section">
          <h4>Action Examples:</h4>

          <button
            class="action-button primary"
            @click=${() => this._showMoreInfo(stateObj.entity_id)}
            title="Tap Action: More Info"
          >
            <ha-icon icon="mdi:information"></ha-icon>
            More Info
          </button>

          <button
            class="action-button secondary"
            @click=${() => this._navigate('/logbook')}
            title="Navigate Action: Go to Logbook"
          >
            <ha-icon icon="mdi:book-open-variant"></ha-icon>
            Logbook
          </button>

          ${this._renderDomainSpecificButtons(stateObj)}

          <button
            class="action-button service"
            @click=${this._handleDemoServiceCall}
            title="Service Call: Persistent Notification"
          >
            <ha-icon icon="mdi:bell"></ha-icon>
            Demo Service
          </button>
        </div>

        <div class="action-hints">
          <div class="hint"><strong>Try:</strong> Tap entity row, Hold card, Double-tap card</div>
          <div class="hint"><strong>Configured actions:</strong> ${this._getConfiguredActions()}</div>
        </div>
      </div>
    `;
  }

  private _renderDomainSpecificButtons(stateObj: HassEntity): TemplateResult {
    const domain = stateObj.entity_id.split('.')[0];

    switch (domain) {
      case 'light':
        return html`
          <button
            class="action-button toggle"
            @click=${() => this._callService('light', 'toggle', { entity_id: stateObj.entity_id })}
          >
            <ha-icon icon="mdi:lightbulb"></ha-icon>
            Toggle Light
          </button>
        `;
      case 'switch':
        return html`
          <button
            class="action-button toggle"
            @click=${() => this._callService('switch', 'toggle', { entity_id: stateObj.entity_id })}
          >
            <ha-icon icon="mdi:toggle-switch"></ha-icon>
            Toggle Switch
          </button>
        `;
      case 'climate':
        return html`
          <button
            class="action-button service"
            @click=${() =>
              this._callService('climate', 'set_temperature', { entity_id: stateObj.entity_id, temperature: 22 })}
          >
            <ha-icon icon="mdi:thermostat"></ha-icon>
            Set 22°C
          </button>
        `;
      default:
        return html``;
    }
  }

  private _handleDemoServiceCall(): void {
    this._callService('persistent_notification', 'create', {
      title: 'Demo Service Call',
      message: `This notification was created by the boilerplate card at ${new Date().toLocaleTimeString()}`,
      notification_id: 'boilerplate_demo',
    });
  }

  private _getConfiguredActions(): string {
    const actions = [];
    if (this.config.tap_action && this.config.tap_action.action !== 'none') {
      actions.push(`Tap: ${this.config.tap_action.action}`);
    }
    if (this.config.hold_action && this.config.hold_action.action !== 'none') {
      actions.push(`Hold: ${this.config.hold_action.action}`);
    }
    if (this.config.double_tap_action && this.config.double_tap_action.action !== 'none') {
      actions.push(`Double-tap: ${this.config.double_tap_action.action}`);
    }
    return actions.length > 0 ? actions.join(', ') : 'None configured';
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      .card-content {
        padding: 16px;
      }

      /* Enhanced cursor and interaction styles */
      .clickable-card {
        cursor: pointer;
        transition: all 0.2s ease-in-out;
      }

      .clickable-card:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
      }

      .clickable-card:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .clickable-row {
        cursor: pointer;
        border-radius: 8px;
        padding: 8px;
        margin: -8px;
        transition: background-color 0.2s ease-in-out;
      }

      .clickable-row:hover {
        background-color: var(--secondary-background-color);
      }

      .clickable-row:active {
        background-color: var(--divider-color);
      }

      .entity-row {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        position: relative;
      }

      .icon {
        margin-right: 16px;
        color: var(--state-icon-color, var(--state-icon-active-color));
        transition: color 0.2s ease-in-out;
      }

      .clickable-row:hover .icon {
        color: var(--primary-color);
      }

      .icon ha-icon {
        width: 24px;
        height: 24px;
      }

      .entity-info {
        flex: 1;
      }

      .entity-actions {
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .entity-row:hover .entity-actions {
        opacity: 1;
      }

      .toggle-hint {
        font-style: italic;
      }

      .name {
        font-weight: 500;
        font-size: 16px;
        color: var(--primary-text-color);
        margin-bottom: 4px;
      }

      .state {
        font-size: 14px;
        color: var(--secondary-text-color);
      }

      .attributes {
        margin: 16px 0;
        padding: 12px;
        background: var(--secondary-background-color);
        border-radius: 8px;
      }

      .attribute {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }

      .attribute:last-child {
        margin-bottom: 0;
      }

      .attr-key {
        text-transform: capitalize;
        color: var(--secondary-text-color);
      }

      .attr-value {
        font-weight: 500;
        color: var(--primary-text-color);
      }

      /* Action buttons styling */
      .action-buttons {
        margin: 16px 0;
        padding: 16px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
      }

      .action-section h4 {
        margin: 0 0 12px 0;
        color: var(--primary-text-color);
        font-size: 14px;
        font-weight: 500;
      }

      .action-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        margin: 4px 4px 4px 0;
        border: none;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        vertical-align: middle;
      }

      .action-button ha-icon {
        display: block;
        margin: 0;
      }

      .action-button.primary {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .action-button.primary:hover {
        background: var(--primary-color);
        filter: brightness(1.1);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .action-button.secondary {
        background: var(--secondary-text-color);
        color: var(--primary-background-color);
      }

      .action-button.secondary:hover {
        background: var(--primary-text-color);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .action-button.toggle {
        background: var(--success-color, #4caf50);
        color: white;
      }

      .action-button.toggle:hover {
        background: var(--success-color, #45a049);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
      }

      .action-button.service {
        background: var(--warning-color, #ff9800);
        color: white;
      }

      .action-button.service:hover {
        background: var(--warning-color, #f57c00);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
      }

      .action-button:active {
        transform: translateY(0);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      .action-hints {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--divider-color);
        font-size: 11px;
        color: var(--secondary-text-color);
      }

      .hint {
        margin-bottom: 4px;
        line-height: 1.4;
      }

      .hint:last-child {
        margin-bottom: 0;
      }

      .timestamps {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--divider-color);
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .last-changed,
      .last-updated {
        margin-bottom: 4px;
      }

      .last-updated {
        margin-bottom: 0;
      }

      /* Responsive design for smaller screens */
      @media (max-width: 600px) {
        .action-button {
          font-size: 11px;
          padding: 6px 10px;
        }

        .entity-row {
          margin-bottom: 12px;
        }

        .action-buttons {
          margin: 12px 0;
          padding: 12px;
        }
      }
    `;
  }
}
