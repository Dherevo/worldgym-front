import { defineComponent } from 'vue';
import translate from '../../modules/translator';
import FormInput from '../../widgets/form-input/form-input.vue';
import Utils from '../../modules/utils';

export default defineComponent({

    components: {FormInput},

    props: {
        canRegister: {
            type: Boolean
        },
        canResetPassword: {
            type: Boolean
        },
        acceptsUsername: {
            type: Boolean
        },
        image: {
            type: String
        },
        logo: {
            type: String
        }
    },

    emits: [
        'submit'
    ],

    data: function() {

        const data : {
            username: string,
            password: string,
            error: string,
            errorMessage: string,
            loading: boolean,
            disableAutocompleteDynamicValue: string
        } = {
            username: '',
            password: '',
            error: '',
            errorMessage: '',
            loading: false,
            disableAutocompleteDynamicValue: Math.random()*1000+""
        };

        return data;
    },
    
    methods: {
        $t(key: string) {
            return translate.get(key);
        },

        validateEmail() {
            if (this.username == '') {
                this.error = 'username';
                if (this.acceptsUsername) {
                    this.errorMessage = this.$t('login.empty_username');
                } else {
                    this.errorMessage = this.$t('login.empty_email');
                }
                return false;
            }

            if (!this.acceptsUsername && !Utils.validateEmail(this.username)) {
                // Only accepts email
                this.error = 'username';
                this.errorMessage = this.$t('login.empty_email');
                return false;
            }

            return true;
        },

        submit() {
            
            if (!this.validateEmail()) {
                return;
            }

            if (this.password == '') {
                this.error = 'password';
                this.errorMessage = this.$t('login.empty_password')
                return;
            }

            this.errorMessage = '';
            this.error = '';

            this.loading = true;

            this.$emit('submit', {
                username: this.username,
                password: this.password,
                success: () => {
                    this.loading = false
                },
                error: (error: string) => {
                    this.loading = false;
                    this.loading = false;
                    this.error = 'credentials';
                    this.errorMessage = error;
                }
            });
        },

        focusPassword() {
            if (!this.validateEmail()) {
                return;
            }

            this.errorMessage = '';
            this.error = '';

            (this.$refs.passwordInput as any).focus();
        }
    }

})