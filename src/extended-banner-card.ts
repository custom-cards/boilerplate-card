/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  customElement,
  property,
  CSSResult,
  TemplateResult,
  css,
  PropertyValues,
  internalProperty,
} from 'lit-element';
import {
  HomeAssistant,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types

import { hasConfigOrEntitiesChanged } from './has-changed';
import type { ExtendedBannerCardConfig, ExtendedBannerCardEntityConfig } from './types';
import { parseEntity, getAttributeOrState, readableColor, isIcon, createElement } from "./utils";
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';
import filterEntity from "./filterEntity";

/* eslint no-console: 0 */
/*console.info(
  `%c  BANNER-CARD-EXT \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);*/

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'extended-banner-card',
  name: 'Extended Banner Card',
  description: 'Banner Card refactored and improved',
});

@customElement('extended-banner-card')
export class ExtendedBannerCard extends LitElement {

  /*public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('extended-banner-card-editor');
  }*/

  public static getStubConfig(): object {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @internalProperty() private config!: ExtendedBannerCardConfig;

  private entityValues!: ExtendedBannerCardEntityConfig[];

  public getCardSize(): number {
    return 3;
  }

  // eslint-disable-next-line @typescript-eslint/camelcase
  private _service(domain, action, entity_id) {
    // eslint-disable-next-line @typescript-eslint/camelcase
    return () => this.hass.callService(domain, action, { entity_id });
  }

  public setConfig(config: ExtendedBannerCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    const rowSizeType = typeof config.row_size;
    let rowSize = 3;
    if (rowSizeType !== "undefined") {
      if (config.row_size < 1) {
        throw new Error("row_size must be at least 1");
      }
      if (config.row_size === "auto") {
        rowSize = config.entities.length;
      } else {
        rowSize = config.row_size;
      }
    }

    this.config = {
      ...config,
      color: config.color ||
          readableColor(
              config.background,
              "var(--bc-heading-color-light)",
              "var(--bc-heading-color-dark)"
          ),
      rowSize: rowSize,
      entities: (config.entities || []).map(parseEntity),
    };
  }

  private _parseEntity(config): ExtendedBannerCardEntityConfig {
    const state = this.hass.states[config.entity];
    const attributes = state ? state.attributes : {};

    let dynamicData: any;
    
    if (config.map_state && state.state in config.map_state) {
      const mappedState = config.map_state[state.state];
      const mapStateType = typeof mappedState;
      if (mapStateType === "string") {
        dynamicData = {value: mappedState};
      } else if (mapStateType === "object") {
        dynamicData = {};
        Object.entries(mappedState).forEach(([key, val]) => {
          dynamicData[key] = val;
        });
      }
    }

    const data = {
      name: attributes.friendly_name,
      state: state ? state.state : "",
      value: getAttributeOrState(state || {}, config.attribute),
      unit: attributes.unit_of_measurement,
      attributes,
      domain: config.entity ? config.entity.split(".")[0] : undefined,
    };

    if (attributes.hasOwnProperty("current_position")) {
      data.state = attributes.current_position;
    }

    return {
      ...data,
      ...config,
      ...dynamicData
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    let result;
    if (!this.config) {
      result = false;
    } else {
      result = hasConfigOrEntitiesChanged(this, changedProps, false);
    }

    return result;
  }

  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }

    return html`
      <ha-card style="background: ${this.config.background};">
        ${this._renderHeading()} ${this._renderEntities()}
      </ha-card>
    `;
  }

  private _renderHeading(): TemplateResult {
    const header = this.config.header;
    if (!header) {
      return html``;
    }

    if (!Array.isArray(header.title)) {
      header.title = [header.title];
    }

    let fontSize = "var(--bc-font-size-heading)";
    let margin = "var(--bc-margin-heading)";
    let fontWeight = "300";
    if (header.mini == true) {
      fontSize = "var(--bc-font-size-heading-mini)";
      margin = "var(--bc-margin-heading-mini)";
      fontWeight = "400";
    }

    return html`
      <h2 class="heading" style="color: ${this.config.color}; margin: ${margin}; font-size: ${fontSize}; font-weight: ${fontWeight}"
        @action=${(event) => this._handleAction(event, header)}
        .actionHandler=${actionHandler({
          hasHold: hasAction(header.hold_action),
          hasDoubleClick: hasAction(header.double_tap_action),
        })}>
        ${header.title.map((fragment) => {
      if (isIcon(fragment)) {
        return html`
              <ha-icon class="heading-icon" .icon="${fragment}"></ha-icon>
            `;
      }
      return html` <span>${fragment}</span> `;
    })}
      </h2>
    `;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private grid(index: any = 1) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    if (index === "full" || index > this.config.rowSize) {
      return `grid-column: span ${this.config.rowSize};`;
    }
    return `grid-column: span ${index};`;
  }

  private _renderEntities(): TemplateResult {
    // Parse new state values for _entities_
    this.entityValues = (this.config.entities || [])
        .filter((conf) => filterEntity(conf, this.hass.states))
        .map((conf) => this._parseEntity(conf));

    if (this.entityValues.length === 0) {
      return html``;
    }

    return html`
      <div class="overlay-strip">
        <div
          class="entities"
          style="grid-template-columns: repeat(${this.config.rowSize}, 1fr);"
        >
          ${this.entityValues.map((config) => {
      if (config.error) {
        return html`
                <div class="entity-state" style="${this.grid(config.size)}">
                  ${this._renderEntityName(config.error)}
                  <span class="entity-value error">${config.entity}</span>
                </div>
              `;
      }

      //const onClick = () => this.openEntityPopover(config.entity);
      //const options = { ...config, onClick };

      // Allow overriding rendering + action if custom is set to true
      /*
      if (config.action) {
        return this.renderCustom({
          ...options,
          action: () => {
            const { service, ...serviceData } = config.action;
            const [domain, action] = service.split(".");
            this.hass.callService(domain, action, {
              entity_id: config.entity,
              ...serviceData,
            });
          },
        });
      }
       */

      // If an attribute is requested we assume not to render
      // any domain specifics
      if (!config.attribute) {
        if (config.type && config.type.startsWith("custom:")) {
          const tag = config.type.split(":")[1];
          let customStyle = "";

          // make the calendar custom component look prettier
          if (tag === "calendar-card") {
            customStyle = "small-text";
          }

          return this.renderCustomElement(tag, config, customStyle);
        }
        
        if (["light", "switch", "input_boolean"].indexOf(config.domain) > -1 && config.toggle == true) {
          this._log(config.entity + "should be rendered as toggle, because domain = " + config.domain + " and toggle = " + config.toggle);
          this._log(config, true);
          return this.renderAsToggle(config);
        } else if (config.domain == "cover") {
          return this.renderDomainCover(config);
        } else if (config.domain == "media_player") {
          return this.renderDomainMediaPlayer(config);
        }
        
      }
      return this._renderDomainDefault(config);
    })}
        </div>
      </div>
    `;
  }

  private _renderDomainDefault(config): TemplateResult {
    const htmlContent = this._renderValue(
        config,
        () => {
          const color = config.color ? `color: ${config.color}` : "";
          return html`<span style="${color}">${config.value} ${config.unit}</span>`
        }
    );
    /*return html`
      <ha-card
        .header=${this.config.name}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        .label=${`Boilerplate: ${this.config.entity || 'No Entity Defined'}`}
      ></ha-card>
    `;*/

    return html`
      <a class="entity-state" style="${this.grid(config.size)}"
        @action=${(event) => this._handleAction(event, config)}
        .actionHandler=${actionHandler({
          hasHold: hasAction(config.hold_action),
          hasDoubleClick: hasAction(config.double_tap_action),
          })}>
        ${this._renderEntityName(config.name)}
        <span class="entity-value">${htmlContent}</span>
      </a>
    `;
  }

  private renderCustomElement(tag, config, customStyle = ""): TemplateResult {
    if (customElements.get(tag)) {
      return html`
      <div class="entity-state" style="${this.grid(config.size || "full")}"
        @action=${(event) => this._handleAction(event, config)}
        .actionHandler=${actionHandler({
          hasHold: hasAction(config.hold_action),
          hasDoubleClick: hasAction(config.double_tap_action),
        })}>
        <div class="entity-value">
          <div class="entity-padded ${customStyle}">
            ${createElement(tag, config, this.hass)}
          </div>
        </div>
      </div>
    `;
    } else {
      console.error(tag + " doesn't exist");
      return html``;
    }
  }

  private renderAsToggle(config): TemplateResult {
    const color = config.color ? config.color : "var(--switch-checked-color)";
    // eslint-disable-next-line @typescript-eslint/camelcase
    return html`<div class="entity-state" style="${this.grid(config.size)}" @action=${(event) => this._handleAction(event, { ...config, tap_action: {action: "toggle"}})}
        .actionHandler=${actionHandler({
          hasHold: hasAction(config.hold_action),
          hasDoubleClick: hasAction(config.double_tap_action),
        })}>
        ${this._renderEntityName(config.name)}
        <span class="entity-value">
          <mwc-switch
            style="--mdc-theme-secondary: ${color};"
            ?checked=${config.state === "on"}
          >
          </mwc-switch>
        </span>
      </div>
    `;
  }

  private renderDomainMediaPlayer(config): TemplateResult {
    const isPlaying = config.state === "playing";

    const a = config.attributes;

    const action = isPlaying ? "media_pause" : "media_play";

    const mediaTitle = [a.media_artist, a.media_title].join(" – ");
    if (!config.tap_action) {
      config['tap_action'] = {action: 'more-info'};
    }
    return html`
      <div class="entity-state" style="${this.grid(config.size || "full")}">
        <div
          @action=${(event) => this._handleAction(event, config)}
          .actionHandler=${actionHandler({
            hasHold: hasAction(config.hold_action),
            hasDoubleClick: hasAction(config.double_tap_action),
          })}>
            ${this._renderEntityName(config.name)}
          </div>
        <div class="entity-value">
          <div class="entity-state-left media-title"
          @action=${(event) => this._handleAction(event, config)}
          .actionHandler=${actionHandler({
            hasHold: hasAction(config.hold_action),
            hasDoubleClick: hasAction(config.double_tap_action),
          })}>${mediaTitle}</div>
          <div class="entity-state-right media-controls">
            <ha-icon-button
              icon="mdi:volume-minus"
              role="button"
              @click=${this._service(config.domain, "volume_down", config.entity)}
            ></ha-icon-button>
            <ha-icon-button
              icon="${isPlaying ? "mdi:pause" : "mdi:play"}"
              role="button"
              @click=${this._service(config.domain, action, config.entity)}
            ></ha-icon-button>
            <ha-icon-button
              icon="mdi:volume-plus"
              role="button"
              @click=${this._service(config.domain, "volume_up", config.entity)}
            ></ha-icon-button>
          </div>
        </div>
      </div>
    `;
  }

  private renderDomainCover(config): TemplateResult {
    const isclosed = config.state === "closed" || config.state === 0.0;
    const isopen = config.state === "open" || config.state === 100.0;
    return html`
      <div class="entity-state" style="${this.grid(config.size)}">
        ${this._renderEntityName(config.name)}
        <span class="entity-value">
          <ha-icon-button
            ?disabled=${isopen}
            icon="hass:arrow-up"
            role="button"
            @click=${this._service("cover", "open_cover", config.entity)}
          ></ha-icon-button>
          <ha-icon-button
            icon="hass:stop"
            role="button"
            @click=${this._service("cover", "stop_cover", config.entity)}
          ></ha-icon-button>
          <ha-icon-button
            ?disabled=${isclosed}
            icon="hass:arrow-down"
            role="button"
            @click=${this._service("cover", "close_cover", config.entity)}
          ></ha-icon-button>
        </span>
      </div>
    `;
  }

  private _renderValue(config, fallback): TemplateResult {
    if (config.icon || isIcon(config.value)) {
      const color = config.color ? `color: ${config.color}` : "";
      return html`
        <ha-icon
          .icon="${config.icon || config.value}"
          style="${color}"
        ></ha-icon>
      `;
    } else if (config.image === true) {
      return html`
        <state-badge
          style="background-image: url(${config.value});"
        ></state-badge>
      `;
    }

    return fallback();
  }

  private _renderEntityName(name): TemplateResult {
    return html` <span class="entity-name">${name}</span> `;
  }

  private _handleAction(ev: ActionHandlerEvent, conf: any): void {
    this._log("Handling the event: " + ev.detail.action);
    this._log(conf, true);
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, conf, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private _log(message: any, raw = false): void {
    if (this.config?.debug) {
      if (raw) {
        console.log(message);
      } else {
        console.log("[banner-card-ex] " + message);
      }
    }
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`
      ${errorCard}
    `;
  }

  // https://lit-element.polymer-project.org/guide/styles
  static get styles(): CSSResult {
    return css`
  :host {
    --bc-font-size-heading: var(--banner-card-heading-size, 3em);
    --bc-font-size-heading-mini: var(--banner-card-heading-size-mini, 2.3em);
    --bc-font-size-entity-value: var(--banner-card-entity-value-size, 1.5em);
    --bc-font-size-media-title: var(--banner-card-media-title-size, 0.9em);
    --bc-margin-heading: var(--banner-card-heading-margin, 1em);
    --bc-margin-heading-mini: var(--banner-card-heading--mini, 0.6em);
    --bc-spacing: var(--banner-card-spacing, 4px);
    --bc-button-size: var(--banner-card-button-size, 32px);
    --bc-heading-color-dark: var(
      --banner-card-heading-color-dark,
      var(--primary-text-color)
    );
    --bc-heading-color-light: var(--banner-card-heading-color-light, #fff);
  }
  ha-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: auto !important;
  }

  a {
    cursor: pointer;
  }

  ha-icon-button {
    width: var(--bc-button-size);
    height: var(--bc-button-size);
    padding: var(--bc-spacing);
  }

  .heading {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }

  ha-icon.heading-icon {
    --iron-icon-width: 1em;
    --iron-icon-height: 1em;
    margin: 0 var(--bc-spacing);
  }

  .overlay-strip {
    background: rgba(0, 0, 0, 0.3);
    overflow: hidden;
    width: 100%;
  }

  .entities {
    padding: calc(var(--bc-spacing) * 2) 0px;
    color: white;
    display: grid;
  }

  .entity-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: var(--bc-spacing);
    margin-bottom: var(--bc-spacing);
    box-shadow: -1px 0px 0 0 white;
    width: 100%;
  }

  .media-title {
    flex: 1 0;
    overflow: hidden;
    font-weight: 300;
    font-size: var(--bc-font-size-media-title);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .media-controls {
    display: flex;
    flex: 0 0 calc(var(--bc-button-size) * 3);
  }

  .entity-padded {
    display: block;
    min-width: -webkit-fill-available;
    padding: 16px 16px 0 16px;
  }

  .small-text {
    font-size: 0.6em;
  }

  .entity-state.expand .entity-value {
    width: 100%;
  }

  .entity-state-left {
    margin-right: auto;
    margin-left: 16px;
  }

  .entity-state-right {
    margin-left: auto;
    margin-right: 16px;
  }

  .entity-name {
    font-weight: 700;
    white-space: nowrap;
    padding-top: calc(var(--bc-spacing) * 2);
    padding-bottom: calc(var(--bc-spacing) * 2);
  }

  .entity-value {
    display: flex;
    width: 100%;
    flex: 1 0;
    font-size: var(--bc-font-size-entity-value);
    align-items: center;
    justify-content: center;
  }

  .entity-value.error {
    display: inline-block;
    word-wrap: break-word;
    font-size: 16px;
    width: 90%;
  }

  .entity-value ha-icon {
    color: white;
  }

  mwc-button {
    --mdc-theme-primary: white;
  }
  mwc-switch {
    --mdc-theme-secondary: white;
  }
`;
  }
}
