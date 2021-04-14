# Lovelace Banner Card Extended

Based on powerful [Boilerplate card](https://github.com/custom-cards/boilerplate-card) example and beautiful [Banner card](https://github.com/nervetattoo/banner-card).

The same as Banner Card, but:
* Supports regular [Lovelace actions](https://www.home-assistant.io/lovelace/actions/) on heading and each entity
* Significantly increased performance (Doesn't render itself on each state change of every entity on your server. Updates only on state change of the entities in the configuration)
* `name` should be used instead of `heading`
