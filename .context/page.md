# Purpose
Create a new page for the project.

# Rules
- Create a folder in the route /src/pages, unless requested a different path.
- Inside this folder create three files: page.vue, page.ts and page.scss (with the name of the asked page in lowercase)
- Inside each file add the following examples (adapted to the requested page)
- Page main div element will always have an id like "name-page".
- SCSS file will always have a root element being #name-page.
- Use layout="default" unless asked differently.
- After creating a page, make sure that file /src/config/routes.ts contains a path to that page.
- Unless requested, do not make up any layout inside the page, do not add more than asked. Do not invent or assume more than what's asked for. Add only the requested code.

# Examples
```vue
<template>
    <AppPage layout="default">
        <div id="name-page">
            Name page
        </div>
    </AppPage>
</template>

<script lang="ts" src="./name.ts"></script>
<style lang="scss" src="./name.scss"></style>
```

```ts 
import { Component, Vue, toNative } from "vue-facing-decorator";

@Component({})
class NamePage extends Vue { }
export default toNative(NamePage);
```

```scss
#name-page { }
```