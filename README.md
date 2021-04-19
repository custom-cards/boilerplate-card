# Lovelace Extended Banner Card

Based on powerful [Boilerplate card](https://github.com/custom-cards/boilerplate-card) example and beautiful [Banner card](https://github.com/nervetattoo/banner-card).

## Main differences
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
### Mapping attributes
Use `map_attribute` to rewrite entity fields the same way as with `map_state`
### Toggles
`light`, `input_boolean` and `switch` are now rendered with text states by default, but you can still render toggles with `toggle: true` for entity configuration.
### Media player
* Default `tap_action` is `more-info`
* Actions are handled on name and media title elements
* Skip buttons replaced with volume controls
### Other improvements
* Increased render performance
* `color` could be applied to text state as well

## Full configutation guide

