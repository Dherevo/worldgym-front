Use Btn component:

```vue
<Btn @click="doSomething()">Text</Btn>
```

Buttons can show loading spinner animation and they should use it until the action is finished:

```vue
<Btn @click="doSomething()" :loading="isLoading">Text</Btn>
```

Buttons can also be disabled:

```vue
<Btn @click="doSomething()" :disabled="isDisabled">Text</Btn>
```

If button must fill the entire width of the space, use the prop "fill":

```vue
<Btn fill>Text</Btn>
```

If button must occupy only the needed space (fit-content) but be centered horizontally, use center:
```vue
<Btn center>Text</Btn>
```

If button must be rounded, use rounded:
```vue
<Btn rounded>Text</Btn>
```

If we want to remove the background and simply leave it as a clickable coloured text, use "nude":
```vue
<Btn nude>Text</Btn>
```