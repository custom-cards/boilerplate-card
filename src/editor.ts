/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor, ActionConfig } from 'custom-card-helpers';

import { BoilerplateCardConfig } from './types';
import { customElement, property, state } from 'lit/decorators';

//For using the same elements as Home Assistant Frontend (2022.3)
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { TextFieldBase } from '@material/mwc-textfield/mwc-textfield-base';
import { NotchedOutlineBase } from '@material/mwc-notched-outline/mwc-notched-outline-base';
import { SelectBase } from '@material/mwc-select/mwc-select-base';
import { ListBase } from '@material/mwc-list/mwc-list-base';
import { ListItemBase } from '@material/mwc-list/mwc-list-item-base';
import { MenuBase } from '@material/mwc-menu/mwc-menu-base';
import { MenuSurfaceBase } from '@material/mwc-menu/mwc-menu-surface-base';
import { RippleBase } from '@material/mwc-ripple/mwc-ripple-base';

import { styles as textfieldStyles } from '@material/mwc-textfield/mwc-textfield.css';
import { styles as notchedOutlineStyles } from '@material/mwc-notched-outline/mwc-notched-outline.css';
import { styles as selectStyles } from '@material/mwc-select/mwc-select.css';
import { styles as listStyles } from '@material/mwc-list/mwc-list.css';
import { styles as listItemStyles } from '@material/mwc-list//mwc-list-item.css';
import { styles as rippleStyles } from '@material/mwc-ripple/mwc-ripple.css';
import { styles as menuStyles } from '@material/mwc-menu/mwc-menu.css';
import { styles as menuSurfaceStyles } from '@material/mwc-menu/mwc-menu-surface.css';

const options = {
  required: {
    icon: 'tune',
    name: 'Required',
    secondary: 'Required options for this card to function',
    show: true,
  },
  actions: {
    icon: 'gesture-tap-hold',
    name: 'Actions',
    secondary: 'Perform actions based on tapping/clicking',
    show: false,
    options: {
      tap: {
        icon: 'gesture-tap',
        name: 'Tap',
        secondary: 'Set the action to perform on tap',
        show: false,
      },
      hold: {
        icon: 'gesture-tap-hold',
        name: 'Hold',
        secondary: 'Set the action to perform on hold',
        show: false,
      },
      double_tap: {
        icon: 'gesture-double-tap',
        name: 'Double Tap',
        secondary: 'Set the action to perform on double tap',
        show: false,
      },
    },
  },
  appearance: {
    icon: 'palette',
    name: 'Appearance',
    secondary: 'Customize the name, icon, etc',
    show: false,
  },
};

@customElement('boilerplate-card-editor')
export class BoilerplateCardEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: BoilerplateCardConfig;

  @state() private _toggle?: boolean;

  @state() private _helpers?: any;

  private _initialized = false;

  static get elementDefinitions() {
    return {
      'mwc-textfield': class extends TextFieldBase {
        static get styles() {
          return textfieldStyles;
        }
      },
      'mwc-notched-outline': class extends NotchedOutlineBase {
        static get styles() {
          return notchedOutlineStyles;
        }
      },
      'mwc-select': class extends SelectBase {
        static get styles() {
          return selectStyles;
        }
      },
      'mwc-list': class extends ListBase {
        static get styles() {
          return listStyles;
        }
      },
      'mwc-list-item': class extends ListItemBase {
        static get styles() {
          return listItemStyles;
        }
      },
      'mwc-ripple': class extends RippleBase {
        static get styles() {
          return rippleStyles;
        }
      },
      'mwc-menu': class extends MenuBase {
        static get styles() {
          return menuStyles;
        }
      },
      'mwc-menu-surface': class extends MenuSurfaceBase {
        static get styles() {
          return menuSurfaceStyles;
        }
      },
    };
  }

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

  get _entity(): string {
    return this._config?.entity || '';
  }

  get _show_warning(): boolean {
    return this._config?.show_warning || false;
  }

  get _show_error(): boolean {
    return this._config?.show_error || false;
  }

  get _tap_action(): ActionConfig {
    return this._config?.tap_action || { action: 'more-info' };
  }

  get _hold_action(): ActionConfig {
    return this._config?.hold_action || { action: 'none' };
  }

  get _double_tap_action(): ActionConfig {
    return this._config?.double_tap_action || { action: 'none' };
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }

    // The climate more-info has ha-switch elements that are lazy loaded unless explicitly done here
    this._helpers.importMoreInfoControl('light');

    // You can restrict on domain type
    const entities = Object.keys(this.hass.states);

    return html`
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
        @input=${this._valueChanged}
      ></mwc-textfield>
      <ha-formfield .label=${`Toggle warning ${this._show_warning ? 'off' : 'on'}`}>
        <ha-switch
          .checked=${this._show_warning !== false}
          .configValue=${'show_warning'}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      <ha-formfield .label=${`Toggle error ${this._show_error ? 'off' : 'on'}`}>
        <ha-switch
          .checked=${this._show_error !== false}
          .configValue=${'show_error'}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
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

  static get styles(): CSSResultGroup {
    return css`
      mwc-select,
      mwc-textfield {
        margin-bottom: 16px;
        display: block;
      }
      ha-formfield {
        padding-bottom: 8px;
      }
    `;
  }
}
