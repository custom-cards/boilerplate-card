# Lovelace Extended Banner Card

Based on powerful [Boilerplate card](https://github.com/custom-cards/boilerplate-card) example and beautiful [Banner card](https://github.com/nervetattoo/banner-card).

The same as Banner Card, but
### Actions
Supports regular [Lovelace actions](https://www.home-assistant.io/lovelace/actions/) on the header and each entity
### Extended header configuration
`header` should be used instead of `heading` with new options: 
```yaml
header:
    title:
        - mdi:television
        - Living Room
    tap_action:
        ...
    hold_action:
        ...
    mini: true
```
### Toggles
`light`, `input_boolean` and `switch` are now rendered with text states by default, but you can still render toggles with `toggle: true` for entity configuration.
### Other improvements
* Increased render performance
* `color` could be applied to text state as well
