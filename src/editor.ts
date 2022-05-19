/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { BoilerplateCardConfig } from './types';
import { customElement, property, state } from 'lit/decorators';
import { formfieldDefinition } from '../elements/formfield';
import { selectDefinition } from '../elements/select';
import { switchDefinition } from '../elements/switch';
import { textfieldDefinition } from '../elements/textfield';

@customElement('boilerplate-card-editor')
export class BoilerplateCardEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: BoilerplateCardConfig;

  @state() private _helpers?: any;

  private _initialized = false;

  static elementDefinitions = {
    ...textfieldDefinition,
    ...selectDefinition,
    ...switchDefinition,
    ...formfieldDefinition,
  };

  public setConfig(config: BoilerplateCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
  }

  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }

    return true;
  }

  get _name(): string {
    return this._config?.name || '';
  }

  get _picker_entity(): string {
    return this._config?.picker_entity || '';
  }

  get _entity(): string {
    return this._config?.entity || '';
  }

  get _show_warning(): boolean {
    return this._config?.show_warning || false;
  }

  get _show_error(): boolean {
    return this._config?.show_error || false;
  }

  protected async firstUpdated(): Promise<void> {
    this.loadEntityPicker();
  }

  async loadEntityPicker(): Promise<void> {
    // Get the local customElement registry
    const registry = (this.shadowRoot as any)?.customElements;
    if (!registry) return;

    // Check if the element we want is already defined in the local scope
    if (registry.get("ha-entity-picker")) return;

    // Load in ha-entity-picker
    // This part will differ for every element you want
    const ch = await (window as any).loadCardHelpers();
    const c = await ch.createCardElement({ type: "entities", entities: [] });
    await c.constructor.getConfigElement();

    // Since ha-elements are not using scopedRegistry we can get a reference to
    // the newly loaded element from the global customElement registry...
    const haEntityPicker = window.customElements.get("ha-entity-picker");

    // ... and use that reference to register the same element in the local registry
    registry.define("ha-entity-picker", haEntityPicker);
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }

    console.info('render');

    // You can restrict on domain type
    const entities = Object.keys(this.hass.states);

    return html`
      <ha-entity-picker .hass=${this.hass} .configValue=${'picker_entity'} .value=${this._picker_entity} name="PickerEntity"
        label="Entity Current Conditions (Required)" allow-custom-entity @value-changed=${this._valueChangedPicker}>
      </ha-entity-picker>
      <mwc-select
        naturalMenuWidth
        fixedMenuPosition
        label="Entity (Required)"
        .configValue=${'entity'}
        .value=${this._entity}
        @selected=${this._valueChanged}
        @closed=${(ev) => ev.stopPropagation()}
      >
        ${entities.map((entity) => {
          return html`<mwc-list-item .value=${entity}>${entity}</mwc-list-item>`;
        })}
      </mwc-select>
      <mwc-textfield
        label="Name (Optional)"
        .value=${this._name}
        .configValue=${'name'}
        @input=${this._valueChanged}>
      </mwc-textfield>
      <mwc-formfield .label=${`Toggle warning ${this._show_warning ? 'off' : 'on'}`}>
        <mwc-switch
          .checked=${this._show_warning !== false}
          .configValue=${'show_warning'}
          @change=${this._valueChanged}>
        </mwc-switch>
      </mwc-formfield>
      <mwc-formfield .label=${`Toggle error ${this._show_error ? 'off' : 'on'}`}>
        <mwc-switch
          .checked=${this._show_error !== false}
          .configValue=${'show_error'}
          @change=${this._valueChanged}>
        </mwc-switch>
      </mwc-formfield>
    `;
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
    this._initialized = true;
  }

  private async loadCardHelpers(): Promise<void> {
    this._helpers = await (window as any).loadCardHelpers();
  }

  private _valueChangedPicker(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      this._config = {
        ...this._config,
        [target.configValue]: target.value,
      };
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        const tmpConfig = { ...this._config };
        delete tmpConfig[target.configValue];
        this._config = tmpConfig;
      } else {
        this._config = {
          ...this._config,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static styles: CSSResultGroup = css`
    mwc-select,
    mwc-textfield {
      margin-bottom: 16px;
      display: block;
    }
    mwc-formfield {
      padding-bottom: 8px;
    }
    mwc-switch {
      --mdc-theme-secondary: var(--switch-checked-color);
    }
  `;
}
