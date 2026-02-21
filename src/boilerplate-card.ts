import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HassEntity } from 'home-assistant-js-websocket';
import {
  HomeAssistant, // The main hass object — passed down from HA on every state change
  hasConfigOrEntityChanged, // Utility: returns true only when config or the tracked entity changed
  hasAction, // Utility: returns true when an ActionConfig is not 'none'
  ActionHandlerEvent, // Event type fired by the action-handler directive
  handleAction, // Utility: routes an action (toggle, more-info, navigate…) to the right HA call
  LovelaceCardEditor, // Interface your editor element must implement
  computeIcon, // Derives the MDI icon for an entity (falls back to domain default)
  computeName, // Derives the friendly_name for an entity
  computeState, // Returns the human-readable state string (respects unit_of_measurement)
  formatTimestamp, // Converts an ISO timestamp to a human-friendly relative string
} from 'custom-card-helpers'; // Community-maintained helpers: https://github.com/custom-cards/custom-card-helpers

// TODO: Replace this import with your own config type once you've defined your fields in types.ts.
import type { BoilerplateCardConfig } from './types';

// Local action-handler directive — provides tap / hold / double-tap gesture support.
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

// Styled console banner so your card is easy to spot in the browser console.
// Stays visible in production — useful for version-mismatch debugging in HA.
console.info(
  `%c  BOILERPLATE-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// Registering with window.customCards makes your card appear in the Lovelace
// "Add Card" UI picker with a name and description. This array is shared by all
// custom cards on the page, so we guard with `|| []` before pushing.
interface WindowWithCustomCards extends Window {
  customCards: Array<{ type: string; name: string; description: string }>;
}

(window as unknown as WindowWithCustomCards).customCards =
  (window as unknown as WindowWithCustomCards).customCards || [];
(window as unknown as WindowWithCustomCards).customCards.push({
  // TODO: Change 'boilerplate-card' to match your @customElement decorator name.
  type: 'boilerplate-card',
  // TODO: Give your card a user-facing name and description.
  name: 'Boilerplate Card',
  description: 'A template custom card for you to create something awesome',
});

// TODO: Rename 'boilerplate-card' to your card's unique tag name.
// Convention: all lowercase, hyphen-separated, and prefixed to avoid clashes
// e.g. 'my-weather-card'. Must match the `type:` in your YAML config and the
// window.customCards entry above.
@customElement('boilerplate-card')
export class BoilerplateCard extends LitElement {
  // getConfigElement is called by HA when the user opens the visual editor.
  // The dynamic import keeps the editor code out of the main bundle — it is only
  // loaded when actually needed, improving initial load time.
  // TODO: If you rename your editor element in editor.ts, update the tag name below.
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

  // getStubConfig returns a minimal valid config used when the user adds your
  // card from the picker without going through the editor first.
  // TODO: Add your required fields here so the card doesn't throw on first render.
  // Example: return { entity: 'light.living_room' };
  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // `hass` is set by HA on every state change anywhere in the system.
  // `attribute: false` means it is set as a JS property, not an HTML attribute
  // (the object is too large to serialize as an attribute).
  // Lit will schedule a re-render whenever this property reference changes.
  @property({ attribute: false }) public hass!: HomeAssistant;

  // `config` is private internal state set via setConfig().
  // Using @state (instead of @property) means it won't be exposed as a public
  // property but will still trigger re-renders when it changes.
  @state() private config!: BoilerplateCardConfig;

  // setConfig is called by HA whenever the YAML config changes (including from
  // the visual editor). It runs before the element is connected to the DOM, so
  // you can't access `this.hass` here — it may not be set yet.
  //
  // Good practices:
  //   • Throw an Error for truly invalid configs (HA will surface it as an error card).
  //   • Spread defaults first, then the user config on top — this lets users omit
  //     optional fields without your render() code needing null-checks everywhere.
  //   • Never call async operations here; use connectedCallback or firstUpdated instead.
  //
  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: BoilerplateCardConfig): void {
    // TODO: Validate required fields. For example:
    //   if (!config.entity) throw new Error('You must provide an entity.');
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    // Merge defaults with the user-supplied config.
    // TODO: Add your own defaults here for any optional config fields.
    this.config = {
      name: 'Boilerplate',
      layout: 'vertical',
      display_mode: 'card',
      ...config,
    };
  }

  // shouldUpdate is a performance gate — return false to skip rendering.
  //
  // `hasConfigOrEntityChanged` returns true when:
  //   • `config` changed, OR
  //   • the hass state for `config.entity` changed.
  //
  // This prevents unnecessary re-renders on every hass update (which fires for
  // every entity state change in the entire system, not just yours).
  //
  // TODO: If your card tracks multiple entities, replace this with a custom check
  // that watches all of them. Example:
  //
  //   if (!changedProps.has('hass')) return changedProps.has('config');
  //   const oldHass = changedProps.get('hass') as HomeAssistant;
  //   if (!oldHass) return true; // first hass update — always render
  //   return ['sensor.a', 'sensor.b'].some(id => oldHass.states[id] !== this.hass.states[id]);
  //
  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // render() is called by Lit whenever shouldUpdate() returns true.
  // It must be a pure function of `this.config` and `this.hass` — no side effects.
  //
  // Pattern used here:
  //   1. Guard clauses first (loading / error states) — bail out early.
  //   2. Derive everything you need from config/hass into local consts.
  //   3. Return a single html`` template at the end.
  //
  // Returning `void` (or nothing) renders nothing; HA won't show an error.
  // Use `_showWarning` / `_showError` to surface problems to the user instead.
  //
  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    // TODO: Add any card-specific guards here — e.g. check for a required
    // config field before trying to use it.
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }

    // `hass` is set asynchronously after the element is created.
    // Showing a skeleton avoids a flash of broken content on first load.
    if (!this.hass) {
      return this._renderSkeleton();
    }

    if (!this.config.entity) {
      return this._showError('No entity defined');
    }

    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) {
      return this._showError(`Entity not found: ${this.config.entity}`);
    }

    // Badge / chip mode — no ha-card wrapper
    if (this.config.display_mode === 'badge') {
      return this._renderBadge(stateObj);
    }

    const actionHandlerConfig = {
      hasHold: hasAction(this.config.hold_action),
      hasDoubleClick: hasAction(this.config.double_tap_action),
      repeat: this.config.hold_action?.repeat,
      repeatLimit: this.config.hold_action?.repeat_limit,
      isMomentary: !!(this.config.press_action || this.config.release_action),
      disableKbd: false,
    };

    const accentColor = this.config.accent_color;
    const inlineStyle = accentColor
      ? `--card-accent-color: rgb(${accentColor[0]},${accentColor[1]},${accentColor[2]});`
      : '';
    const layoutClass = `layout-${this.config.layout || 'vertical'}`;
    const styleClass = `style-${this.config.card_style || 'default'}`;

    // Horizontal: suppress ha-card header — content fills the whole row
    const cardHeader = this.config.layout === 'horizontal' ? undefined : this.config.name;

    return html`
      <ha-card
        .header=${cardHeader}
        @action=${this._handleAction}
        ${actionHandler(actionHandlerConfig)}
        .config=${this.config}
        tabindex="0"
        .label=${`Boilerplate: ${this.config.entity}`}
        class="clickable-card ${styleClass} ${layoutClass}"
        style=${inlineStyle}
      >
        ${this._renderContent(stateObj)}
        <ha-ripple
          .disabled=${!hasAction(this.config.tap_action) &&
          !hasAction(this.config.hold_action) &&
          !hasAction(this.config.double_tap_action)}
        ></ha-ripple>
      </ha-card>
    `;
  }

  private _renderSkeleton(): TemplateResult {
    return html`
      <ha-card>
        <div class="card-content skeleton-content">
          <div class="skeleton-row">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton-text-block">
              <div class="skeleton skeleton-name"></div>
              <div class="skeleton skeleton-state"></div>
            </div>
          </div>
          <div class="skeleton skeleton-attr"></div>
          <div class="skeleton skeleton-attr skeleton-attr--short"></div>
        </div>
      </ha-card>
    `;
  }

  private _renderBadge(stateObj: HassEntity): TemplateResult {
    const accentColor = this.config.accent_color;
    const inlineStyle = accentColor
      ? `--card-accent-color: rgb(${accentColor[0]},${accentColor[1]},${accentColor[2]});`
      : '';
    return html`
      <div
        class="badge"
        style=${inlineStyle}
        @click=${this._handleEntityClick}
        role="button"
        tabindex="0"
        aria-label=${`${computeName(stateObj)}: ${computeState(stateObj)}`}
      >
        <ha-icon class="badge-icon" .icon=${computeIcon(stateObj, this.config.icon)}></ha-icon>
        <span class="badge-name">${computeName(stateObj)}</span>
        <span class="badge-state">${computeState(stateObj)}</span>
      </div>
    `;
  }

  // _renderContent separates layout logic from the main render() method.
  // Splitting complex templates into private helper methods keeps render()
  // readable at a glance. Each helper should have a single responsibility.
  private _renderContent(stateObj: HassEntity): TemplateResult {
    const isHorizontal = this.config.layout === 'horizontal';
    const isMinimal = this.config.card_style === 'minimal';

    if (isHorizontal) {
      // Single compact row: icon · name+state · spacer · action buttons
      return html`
        <div class="card-content horizontal-strip">
          <div class="icon">
            <ha-icon .icon=${computeIcon(stateObj, this.config.icon)}></ha-icon>
          </div>
          <div class="entity-info">
            <div class="name">${this.config.name ?? computeName(stateObj)}</div>
            <div class="state">${computeState(stateObj)}</div>
          </div>
          <div class="horizontal-actions">${this._renderActionButtons(stateObj)}</div>
        </div>
      `;
    }

    // Vertical (default) — stacked sections
    const entityRow = html`
      <div class="entity-row clickable-row" @click=${this._handleEntityClick}>
        <div class="icon">
          <ha-icon .icon=${computeIcon(stateObj, this.config.icon)}></ha-icon>
        </div>
        <div class="entity-info">
          <div class="name">${computeName(stateObj)}</div>
          <div class="state">${computeState(stateObj)}</div>
        </div>
        <div class="entity-actions"><div class="toggle-hint">Tap to toggle</div></div>
      </div>
    `;

    return html`
      <div class="card-content">
        ${entityRow} ${!isMinimal ? this._renderAttributes(stateObj, this.config.attribute_limit ?? 3) : ''}
        ${!isMinimal ? this._renderActionButtons(stateObj) : ''}
        ${this.config.show_timestamps !== false
          ? html`
              <div class="timestamps">
                <div class="last-changed"><strong>Last Changed:</strong> ${formatTimestamp(stateObj.last_changed)}</div>
                <div class="last-updated"><strong>Last Updated:</strong> ${formatTimestamp(stateObj.last_updated)}</div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  // _handleAction is wired to the `@action` DOM event emitted by the
  // action-handler directive. `handleAction` from custom-card-helpers reads
  // ev.detail.action ('tap' | 'hold' | 'double_tap') and executes whichever
  // ActionConfig the user configured (navigate, more-info, call-service, etc.).
  //
  // TODO: You can intercept specific actions here before delegating, e.g.
  //   if (ev.detail.action === 'tap') { /* custom tap logic */ return; }
  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  // _handleEntityClick demonstrates direct service calls without going through
  // the configured tap_action. It shows how to branch on entity domain and call
  // the appropriate HA service.
  //
  // In a real card you'd typically rely on handleAction() with tap_action instead
  // of writing domain-specific logic here — this is for educational purposes.
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

  // _renderAttributes shows a filtered subset of entity attributes.
  //
  // Why filter? `stateObj.attributes` can contain dozens of keys (HA internals,
  // integration-specific data, etc.). Displaying everything would be noisy.
  //
  // TODO: Replace `importantAttrs` with the attributes relevant to your card's
  // domain, or make the list configurable via `config.attribute_config`.
  private _renderAttributes(stateObj: HassEntity, limit = 3): TemplateResult {
    if (limit === 0) return html``;
    // TODO: Adjust this list to match the attributes your card cares about.
    const importantAttrs = ['battery_level', 'temperature', 'humidity', 'brightness', 'volume_level'];
    const attrs = Object.entries(stateObj.attributes)
      .filter(([key, _]) => importantAttrs.includes(key))
      .slice(0, limit);

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

  // _renderActionButtons exists purely to demonstrate the different action
  // mechanisms available in HA custom cards. In a production card you would
  // replace (or remove) this section with domain-appropriate controls.
  //
  // The four patterns shown:
  //   1. `_showMoreInfo`  — fires the hass-more-info event (HA's built-in detail dialog)
  //   2. `_navigate`      — pushes a path to the HA router
  //   3. Domain buttons   — directly call HA services via `hass.callService`
  //   4. `_handleDemoServiceCall` — creates a persistent notification via service call
  //
  // TODO: Remove or replace this method with the controls your card actually needs.
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

  // Styles are encapsulated inside the Shadow DOM — they cannot leak out and
  // external page styles cannot leak in (except for CSS custom properties).
  //
  // Use HA's CSS custom properties (e.g. `--primary-color`, `--divider-color`)
  // so your card automatically adapts to the user's chosen theme.
  // Full property list: https://github.com/home-assistant/frontend/blob/dev/src/resources/ha-style.ts
  //
  // TODO: Replace the demo styles below with styles for your own card layout.
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
        color: var(--card-accent-color, var(--state-icon-color, var(--state-icon-active-color)));
        transition: color 0.2s ease-in-out;
      }

      .clickable-row:hover .icon {
        color: var(--card-accent-color, var(--primary-color));
      }

      /* Card style variants */
      .style-compact .card-content {
        padding: 8px;
      }
      .style-compact .entity-row {
        margin-bottom: 8px;
      }
      .style-compact .name {
        font-size: 14px;
      }
      .style-compact .state {
        font-size: 12px;
      }
      .style-compact .action-buttons,
      .style-compact .attributes {
        margin: 8px 0;
        padding: 8px;
      }

      .style-detailed .name {
        font-size: 20px;
      }
      .style-detailed .state {
        font-size: 16px;
      }
      .style-detailed .icon ha-icon {
        width: 36px;
        height: 36px;
      }
      .style-detailed .card-content {
        padding: 24px;
      }

      .style-minimal .card-content {
        padding: 12px 16px;
      }
      .style-minimal .attributes,
      .style-minimal .timestamps {
        display: none;
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

      /* ── Horizontal layout ────────────────────────────────── */
      .layout-horizontal {
        --ha-card-border-radius: var(--ha-card-border-radius, 12px);
      }
      .horizontal-strip {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
      }
      .horizontal-strip .icon {
        margin-right: 0;
        flex-shrink: 0;
      }
      .horizontal-strip .entity-info {
        flex: 1;
        min-width: 0;
      }
      .horizontal-strip .name,
      .horizontal-strip .state {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .horizontal-strip .horizontal-actions {
        flex-shrink: 0;
        display: flex;
        align-items: center;
      }
      .horizontal-strip .action-buttons {
        margin: 0;
        padding: 0;
        background: none;
        border: none;
      }
      .horizontal-strip .action-section h4,
      .horizontal-strip .action-hints {
        display: none;
      }

      /* ── Badge / chip mode ───────────────────────────────────── */
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px 4px 6px;
        border-radius: 999px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        cursor: pointer;
        font-size: 13px;
        transition:
          box-shadow 0.15s ease,
          background 0.15s ease;
        user-select: none;
        -webkit-user-select: none;
      }
      .badge:hover {
        box-shadow: var(--shadow-elevation-4dp, 0 2px 6px rgba(0, 0, 0, 0.18));
        background: var(--secondary-background-color);
      }
      .badge:active {
        box-shadow: none;
      }
      .badge-icon {
        --mdc-icon-size: 18px;
        color: var(--card-accent-color, var(--state-icon-color));
      }
      .badge-name {
        font-weight: 500;
        color: var(--primary-text-color);
      }
      .badge-state {
        color: var(--secondary-text-color);
      }

      /* ── Skeleton / loading UI ───────────────────────────────── */
      @keyframes skeleton-pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }
      .skeleton {
        border-radius: 4px;
        background: var(--divider-color);
        animation: skeleton-pulse 1.4s ease-in-out infinite;
      }
      .skeleton-content {
        pointer-events: none;
      }
      .skeleton-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }
      .skeleton-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .skeleton-text-block {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .skeleton-name {
        height: 16px;
        width: 55%;
      }
      .skeleton-state {
        height: 13px;
        width: 35%;
      }
      .skeleton-attr {
        height: 12px;
        width: 80%;
        margin-bottom: 8px;
      }
      .skeleton-attr--short {
        width: 55%;
      }

      /* ── Theme-aware CSS custom properties ───────────────────── */
      :host {
        --card-accent-color: var(--primary-color);
      }

      /* ── Responsive ─────────────────────────────────────────── */
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
        .horizontal-strip {
          flex-wrap: wrap;
        }
        .horizontal-strip .horizontal-actions {
          width: 100%;
          justify-content: flex-start;
        }
      }
    `;
  }
}
