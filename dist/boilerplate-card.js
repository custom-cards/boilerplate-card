import { d as __decorate, e as property, f as customElement, a as LitElement, b as html, c as css } from './chunk-d5e41da3.js';

// TODO Name your custom element
let BoilerplateCard = class BoilerplateCard extends LitElement {
    static async getConfigElement() {
        await import(/* webpackChunkName: "boilerplate-card-editor" */ './boilerplate-card-editor.js');
        return window.document.createElement('boilerplate-card-editor');
    }
    static getStubConfig() {
        return {};
    }
    setConfig(config) {
        // TODO Check for required fields and that they are of the proper format
        if (!config || config.show_error) {
            throw new Error('Invalid configuration');
        }
        this._config = config;
    }
    render() {
        if (!this._config || !this.hass) {
            return html ``;
        }
        // TODO Check for stateObj or other necessary things and render a warning if missing
        if (this._config.show_warning) {
            return html `
        <ha-card>
          <div class="warning">Show Warning</div>
        </ha-card>
      `;
        }
        return html `
      <ha-card .header=${this._config.name ? this._config.name : 'Boilerplate'}></ha-card>
    `;
    }
    static get styles() {
        return css `
      .warning {
        display: block;
        color: black;
        background-color: #fce588;
        padding: 8px;
      }
    `;
    }
};
__decorate([
    property()
], BoilerplateCard.prototype, "hass", void 0);
__decorate([
    property()
], BoilerplateCard.prototype, "_config", void 0);
BoilerplateCard = __decorate([
    customElement('boilerplate-card')
], BoilerplateCard);
