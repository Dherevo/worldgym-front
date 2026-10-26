# Purpose
Create a new component for the project.

# Rules
- Create a folder in the route /src/components, unless requested a different path.
- Inside this folder create three files: component.vue, component.ts and component.scss (with the name of the asked page in lowercase)
- Inside each file add the following examples (adapted to the requested page)
- Component main div element will always have a class named like the component.
- SCSS file will always have a root element being .component-class.
- Unless requested, do not make up any layout inside the page, do not add more than asked. Do not invent or assume more than what's asked for. Add only the requested code.

# Examples
```vue
<template>
    <div class="component">
        Name component
    </div>
</template>

<script lang="ts" src="./name.ts"></script>
<style lang="scss" src="./name.scss"></style>
```

```ts 
import { Component, Vue, toNative } from "vue-facing-decorator";

@Component({})
class NameComponent extends Vue { }
export default toNative(NameComponent);
```

```scss
.name-component { }
```