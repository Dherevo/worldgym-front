Take this example to build form pages or components:

```vue
<form>
    <FormInput 
        v-model="user.name"
        :label="$t('generic.name')"
        required
        :validator="validator.add('name').notEmpty().causesError('Field is mandatory')" />

    <FormInput 
        v-model="user.lastname"
        :label="$t('generic.lastname')"
        required
        :validator="validator.add('lastname').notEmpty().causesError('Field is mandatory')" />

    <FormInput 
        v-model="user.email"
        type="email"
        :label="$t('generic.email')"
        required
        :validator="validator.add('email').isEmail().causesError('Invalid email')" />

    <Btn @click="submit()" :loading="loading">Submit</Btn>
</form>
```

```ts
import { FormInput, Validator } from 'lib';
import { Component, Vue, toNative } from "vue-facing-decorator";
import User from '@/models/user';

@Component({
    components: {
        FormInput
    }
})
class FormComponent extends Vue {

    user: User = new User();

    validator: Validator = new Validator();
    loading: boolean = false;

    submit() {
        if (!this.validator.validate()) return;

        this.loading = true;

        this.user.save()
        .then(() => {
            // Success notification
        })
        .catch(() => {
            // Error notification
        })
        .finally(() => {
            this.loading = false;
        })
    }

}
export default toNative(FormComponent);
```