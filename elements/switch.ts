import { SwitchBase } from '@material/mwc-switch/deprecated/mwc-switch-base';
import { styles as switchStyles } from '@material/mwc-switch/deprecated/mwc-switch.css';

export const switchDefinition = {
  'mwc-switch': class extends SwitchBase {
    static get styles() {
      return switchStyles;
    }
  },
};
