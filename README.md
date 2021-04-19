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

## Card configuration:

| Key | Type | Description |
| --- | --- | --- |
| type | _*string_ | Always `'custom:extended-banner-card'` |
| header | _string_ or _map_ | Remove to hide header. See [header configuration](#header-configuration) for options
| background | _string_ | A valid CSS color to use as the background  |
| color | _string_ | A valid CSS color to use as the text color |
| entities | _*list_ | A list of entities to display. See [entities configuration](#entities-configuration) |
| row_size | _number_ or _string_ | Number of columns in the grid. `3` is the default and what looks best in many cases. Set to `auto` to set `row_size` to a number of entities |

### Header configuration

| Key | Type | Description |
| --- | --- | --- |
| title | _string_ or _list_ | The heading to display. Can be a list with texts and icons. |
| mini | _boolean_ | Set to `true` to make header smaller |
| tap_action | _map_ | See [Lovelace Tap-Action](https://www.home-assistant.io/lovelace/actions/#tap-action) |
| hold_action | _map_ | See [Lovelace Hold-Action](https://www.home-assistant.io/lovelace/actions/#hold-action) |

Big header with icon and text:
```yaml
header:
    mini: false
    title:
        - mdi:shower
        - Bathroom
```

### Entities configuration

Could be a list of string entity ids, or a map with:
| Key | Type | Description |
| --- | --- | --- |
| entity | _string_ | Entity ID |
| unit | _string_ | Override for units of measurement |
| name | _string_ | Override for entity name |
| attribute | _string_ | The name of an attribute to display instead of the state |
| map_state | _map_ | Override entity options for specific state. See [state mapping](#state-mapping) |
| map_attributes | _map_ | Override entity options for specific attribute value when displaying `attribute` instead of the state. See [attribute values mapping](#attribute-values-mapping) |
| size | _number_ | Override how many "entity cells" this entity will fill. The default for most entities is 1 cell, except if you include a media_player which will use whatever is the value for row_size, thus full width. |
| when | _map_ | Entity displaying conditions. See [using when](#using-when) |
| image | _boolean_ | Set to `true` to force value displaying as a rounded image |
| tap_action | _map_ | See [Lovelace Tap-Action](https://www.home-assistant.io/lovelace/actions/#tap-action) |
| hold_action | _map_ | See [Lovelace Hold-Action](https://www.home-assistant.io/lovelace/actions/#hold-action) |
| toggle | _boolean_ | Set to `true` to render `light`, `switch` or `input_boolean` as a toggle |

### State mapping

You can use `map_state` to force a value or icon to be rendered when the entity has a certain state. It either supports a full object where you can override any key for the entity, like `value`, `name`, `unit`, `color` and so on, or a shorthand string that maps to `value`.
Both forms in the example:

```yaml
entity: media_player.office
map_state:
  playing: mdi:disc-player
  not_playing:
    value: mdi:stop
    name: A custom entity heading
    color: red
```

### Attribute values mapping

You can use `map_attribute` to force a value or icon to be rendered when the entity attribute has a certain value. It either supports a full object where you can override any key for the entity, like `value`, `name`, `unit`, `color` and so on, or a shorthand string that maps to `value`.

```yaml
entity: climate.child_room
attribute: hvac_action
map_attribute:
    heating:
        value: 'mdi:radiator'
    idle:
        value: 'mdi:radiator-disabled'
    'off':
        value: 'mdi:radiator-disabled'
        color: '#ffffff44'
```

### Using when

You can filter entities with a simple but powerful `when` option. This allows you to filter based on state and/or attributes. See examples below.

This limits to only showing a media_player entity when it is playing. It uses the shorthand form for `when` where a simple string is used instead of specifying an object with state key.

```yaml
entity: media_player.office
when: playing
```

This example limits to only showing a light entity when its on and above a certain brightness

```yaml
entity: light.my_light
when:
  state: "on"
  attributes:
    brightness: [">", 50]
```

The last example shows how passing a simple string/number will imply an equality operator check, whereas you can configure using an array to using different operators. The following operators exist:

### When operators

| Operator | Description                                                                                                                                                                                           | Example                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `=`      | **Equal** check to either match a string/number/boolean input, or if given an array, check that the real value exists inside said array. This is the default operator used when a simple value is set | `state: ['=', 'on', 'off']`              |
| !=       | **Not equal** check that is exactly like the equal check, just negated (opposite results)                                                                                                             | `fan_mode: ['!=', 'On Low', 'Auto Low']` |
| >        | **Bigger than** checks if real value is bigger than what is set. Does not support multiple values                                                                                                     | `brightness: ['>', 50]`                  |
| <        | **Smaller than** checks if real value is smaller than what is set. Does not support multiple values                                                                                                   | `brightness: ['<', 50]`                  |
