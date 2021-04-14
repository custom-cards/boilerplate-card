# Lovelace Extended Banner Card
## `type: 'custom:extended-banner-card'`
Based on powerful [Boilerplate card](https://github.com/custom-cards/boilerplate-card) example and beautiful [Banner card](https://github.com/nervetattoo/banner-card).

The same as Banner Card, but
### Actions
Supports regular [Lovelace actions](https://www.home-assistant.io/lovelace/actions/) on the header and each entity
### Extended header configuration
`header` should be used instead of `heading` with new options: 
```yaml
header:
    title:
        - mdi:sofa
        - Living Room
    tap_action:
        ...
    hold_action:
        ...
    mini: true
```
### Other improvements
* Increased performance (Doesn't render itself on each state change of every entity on your server. Updates only on state change of the entities in the configuration)
* `name` should be used instead of `heading`
* Use `toggle: true` to render `light`, `input_boolean` or `switch` as toggle
* `color` could be applied to text state as well