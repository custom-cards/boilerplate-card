import {
  html,
  LitElement,
  TemplateResult,
  customElement,
  property,
  css,
  CSSResult,
} from 'lit-element';
import '@polymer/paper-input/paper-input';
import '@polymer/paper-toggle-button/paper-toggle-button';
import { superstruct } from 'superstruct';

import { BoilerplateConfig } from './index';

const cardConfigStruct = superstruct({
  type: 'string',
  name: 'string?',
  show_error: 'boolean?',
  show_warning: 'boolean?',
});

@customElement('boilerplate-card-editor')
export class BoilerplateCardEditor extends LitElement {
  @property() public hass?: any;

  @property() private _config?: BoilerplateConfig;

  public setConfig(config: BoilerplateConfig): void {
    config = cardConfigStruct(config);
    this._config = config;
  }

  get _name(): string {
    return this._config!.name || '';
  }

  get _show_error(): boolean {
    return this._config!.show_error || false;
  }

  get _show_warning(): boolean {
    return this._config!.show_warning || false;
  }

  protected render(): TemplateResult | void {
    if (!this.hass) {
      return html``;
    }

    return html`
      <div class="card-config">
        <paper-input
          label="Name (Optional)"
          .value="${this._name}"
          .configValue="${' name'}"
          @value-changed="${this._valueChanged}"
        ></paper-input>
        <div class="side-by-side">
          <paper-toggle-button
            ?checked="${this._show_error !== false}"
            .configValue="${'show_error'}"
            @change="${this._valueChanged}"
            >Show Error?</paper-toggle-button
          >
          <paper-toggle-button
            ?checked="${this._show_warning !== false}"
            .configValue="${'show_warning'}"
            @change="${this._valueChanged}"
            >Show Warning?</paper-toggle-button
          >
        </div>
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      paper-toggle-button {
        padding-top: 16px;
      }
      .side-by-side {
        display: flex;
      }
      .side-by-side > * {
        flex: 1;
        padding-right: 4px;
      }
    `;
  }

  private _valueChanged(ev: Event): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target! as any;

    if (
      this[`_${target.configValue}`] === target.value
      || this[`_${target.configValue}`] === target.config
    ) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        delete this._config[target.configValue!];
      } else {
        this._config = {
          ...this._config,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }

    this._fireEvent(this, 'config-changed', { config: this._config }, null);
  }

  private _fireEvent = (node, type, detail, options) => {
    options = options || {};
    detail = detail === null || detail === undefined ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed,
    }) as any;

    event.detail = detail;
    node.dispatchEvent(event);

    return event;
  };
}
