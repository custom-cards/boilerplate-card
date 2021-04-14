import { PropertyValues } from "lit-element";

import { HomeAssistant } from "custom-card-helpers";

// Check if config or Entity changed
export function hasConfigOrEntitiesChanged(
    element: any,
    changedProps: PropertyValues,
    forceUpdate: boolean,
): boolean {
    if (changedProps.has('config') || forceUpdate) {
        return true;
    }

    let someItemChanged = false;
    element.config?.entities.forEach(item => {
        if (item.entity) {
            const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
            if (oldHass && oldHass.states[item.entity] !== element.hass?.states[item.entity]) {
                someItemChanged = true;
            }
        }
    });

    return someItemChanged;
}