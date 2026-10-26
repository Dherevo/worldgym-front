
export default class Validator {

    public name: string = '';
    private value?: () => any;

    private parent?: Validator;
    private validators: {[name: string]: Validator} = {};

    private checks: any[];
    private debugMode: boolean = false;

    public error: boolean = false;
    public errorMessage: string = '';

    private _callbacks: {[name: string]: ((valid: boolean, displayErrors: boolean) => void)} = {};
    public onValidated(name: string, callback: ((valid: boolean, displayErrors: boolean) => void)) {
        this._callbacks[name] = callback;
    }

    private formInput?: any;
    public setFormInput(formInput: any) {
        this.formInput = formInput;
        for(const validator of Object.values(this.validators)) {
            validator.setFormInput(formInput);
        }
    }

    constructor(value?: () => any) {
        if (value !== undefined) this.value = value;
        this.checks = [];
    }

    static for(value: any) {
        if (typeof value == 'function') {
            return new Validator(value);
        }
        return new Validator(() => value);
    }

    getParent() {
        return this.parent;
    }

    causesError(error: string) {
        this.errorMessage = error;
        return this;
    }

    debug() {
        this.debugMode = true;
        for(const validator of Object.values(this.validators)) {
            validator.debug();
        }
        return this;
    }

    add(name: string, value?: any) {
        const validator = value instanceof Validator ? value : new Validator(value ?? this.value);
        this.validators[name] = validator;
        validator.parent = this;
        validator.name = name;

        if (this.debugMode) {
            validator.debug();
        }
        return validator;
    }

    use(value: any) {
        this.value = () => value;
        for(const validator of Object.values(this.validators)) {
            validator.value = () => value;
        }
        return this;
    }

    getter(valueGetter: () => any) {
        this.value = valueGetter;
        for(const validator of Object.values(this.validators)) {
            validator.value = valueGetter;
        }
        return this;
    }

    get(name: string) {
        return this.validators[name] ?? undefined;
    }

    isString() {
        this.checks.push({
            name: this.name + ' isString',
            function: function(value: any) {
                return typeof value == 'string';
            }
        });

        return this;
    }

    is(e: any) {

        this.checks.push({
            name: this.name + ' is',
            function: function(value: any, param: any) {
                return value === param;
            },
            parameter: e
        });

        return this;

    }

    isNot(e: any) {

        this.checks.push({
            name: this.name + ' isNot',
            function: function(value: any, param: any) {
                return value != param;
            },
            parameter: e
        });

        return this;

    }

    typeIs(type: string|string[]) {

        this.checks.push({
            name: this.name + ' typeIs ' + type,
            function: function(value: any, param: string|string[]) {
                const type = typeof value;
                const types = typeof param == 'string' ? [param] : param;

                for(const t of types) {
                    if (type == t) {
                        return true;
                    }
                }
                return false;
            },
            parameter: type
        });

        return this;

    }

    typeIsNot(type: string|string[]) {

        this.checks.push({
            name: this.name + ' typeIsNot ' + type,
            function: function(value: any, param: string|string[]) {
                const type = typeof value;
                const types = typeof param == 'string' ? [param] : param;

                for(const t of types) {
                    if (type == t) {
                        return false;
                    }
                }
                return true;
            },
            parameter: type
        });

        return this;

    }

    isArray() {

        this.checks.push({
            name: this.name + ' isArray',
            function: function(value: any) {
                return Array.isArray(value);
            },
        });

        return this;

    }

    isNotArray() {

        this.checks.push({
            name: this.name + ' isNotArray',
            function: function(value: any) {
                return !Array.isArray(value);
            },
        });

        return this;

    }

    contains(e: any) {

        this.checks.push({
            name: this.name + ' contains ' + e,
            function: function(value: any, param: any) {
                if (!value || !value['includes']) return false;
                return value.includes(param);
            },
            parameter: e
        });

        return this;

    }

    notContains(e: any) {

        this.checks.push({
            name: this.name + ' notContains ' + e,
            function: function(value: any, param: any) {
                if (!value || !value['includes']) return false;
                return !value.includes(param);
            },
            parameter: e
        });

        return this;

    }

    minLength(length: number) {
        this.checks.push({
            name: this.name + ' minLength ' + length,
            function: function(value: any, param: number) {
                if (!value || !value['length']) return false;
                return value.length >= param;
            },
            parameter: length
        });

        return this;
    }

    maxLength(length: number) {
        this.checks.push({
            name: this.name + ' maxLength ' + length,
            function: function(value: any, param: number) {
                if (!value || !value['length']) return false;
                return value.length <= param;
            },
            parameter: length
        });

        return this;
    }

    isEmail() {
        this.checks.push({
            name: this.name + ' isEmail',
            function: function(email: any) {
                if (!email) return false;
                if (email == "") return false;
                if (email.length < 4) return false;
        
                const c1 = email.indexOf("@");
                const c2 = email.lastIndexOf(".");
                if (c1 < 0) return false;
                if (c2 < 0) return false;
                if (c2 < c1) return false;
        
                const parts1 = email.split('@');
                const parts2 = parts1[1].split('.');
                
                if (parts1[0] == '') return false;
                if (parts2[0] == '') return false;
                if (parts2[1] == '') return false;
        
                return true;
            }
        });

        return this;
    }

    isUppercase() {
        this.checks.push({
            name: this.name + ' isUppercase',
            function: function(value: string) {
                if (typeof value != 'string') return false;
                if (!/^[a-zA-ZàáäâéèëêìíïîòóöôùúüûñÑÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛ]+$/.test(value)) {
                    return false;
                }
                return value == value.toUpperCase();
            }
        });

        return this;
    }

    isLowercase() {
        this.checks.push({
            name: this.name + ' isLowercase',
            function: function(value: string) {
                if (typeof value != 'string') return false;
                if (!/^[a-zA-ZàáäâéèëêìíïîòóöôùúüûñÑÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛ]+$/.test(value)) {
                    return false;
                }
                return value == value.toLowerCase();
            }
        });

        return this;
    }

    hasUppercase(min = 1) {
        this.checks.push({
            name: this.name + ' hasUppercase ' + min,
            function: function(value: string, param: number) {
                if (typeof value != 'string') return false;

                let count = 0;

                for(let i = 0; i < value.length; ++i) {
                    if (!/^[a-zA-ZàáäâéèëêìíïîòóöôùúüûñÑÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛ]+$/.test(value[i])) {
                        continue;
                    }

                    if (value[i].toUpperCase() == value[i]) {
                        count += 1;

                        if (count >= param) {
                            return true;
                        }
                    }

                }

                return false;
            },
            parameter: min
        });

        return this;
    }

    hasNotUppercase() {
        this.checks.push({
            name: this.name + ' hasNotUppercase',
            function: function(value: string) {
                if (typeof value != 'string') return true;

                for(let i = 0; i < value.length; ++i) {
                    if (!/^[a-zA-ZàáäâéèëêìíïîòóöôùúüûñÑÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛ]+$/.test(value[i])) {
                        continue;
                    }

                    if (value[i] == value[i].toUpperCase()) {
                        return false;
                    }
                }

                return true;
            }
        });

        return this;
    }

    hasLowercase(min = 1) {
        this.checks.push({
            name: this.name + ' hasLowercase ' + min,
            function: function(value: string, param: number) {
                if (typeof value != 'string') return false;

                let count = 0;

                for(let i = 0; i < value.length; ++i) {
                    if (!/^[a-zA-ZàáäâéèëêìíïîòóöôùúüûñÑÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛ]+$/.test(value[i])) {
                        continue;
                    }

                    if (value[i] == value[i].toLowerCase()) {
                        count += 1;

                        if (count >= param) {
                            return true;
                        }
                    }
                }

                return false;
            },
            parameter: min
        });

        return this;
    }

    hasNotLowercase() {
        this.checks.push({
            name: this.name + ' hasNotLowercase',
            function: function(value: string) {
                if (typeof value != 'string') return true;

                for(let i = 0; i < value.length; ++i) {
                    if (!/^[a-zA-ZàáäâéèëêìíïîòóöôùúüûñÑÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛ]+$/.test(value[i])) {
                        continue;
                    }

                    if (value[i] == value[i].toLowerCase()) {
                        return false;
                    }
                }

                return true;
            }
        });

        return this;
    }

    isNumber() {
        this.checks.push({
            name: this.name + ' isNumber',
            function: function(value: string|number) {
                if(typeof value == 'number') {
                    return true;
                }

                const chars = '+-0123456789,.';

                for(let i = 0; i < value.length; ++i) {
                    if (!chars.includes(value[i])) {
                        return false;
                    }
                }
                return true;
            }
        });

        return this;
    }

    hasNumbers(min = 1) {

        this.checks.push({
            name: this.name + ' hasNumbers ' + min,
            function: function(value: any, param: number) {

                let count = 0;

                for(let i = 0; i < value.length; ++i) {

                    if ('0123456789'.includes(value[i])) {
                        count += 1;

                        if (count >= param) {
                            return true;
                        }
                    }
                }

                return false;
            },
            parameter: min
        });

        return this;

    }

    hasNotNumbers() {

        this.checks.push({
            name: this.name + ' hasNotNumbers',
            function: function(value: string) {

                for(let i = 0; i < value.length; ++i) {
                    if ('0123456789'.includes(value[i])) {
                        return false;
                    }
                }

                return true;
            }
        });

        return this;

    }

    isLetters() {
        this.checks.push({
            name: this.name + ' isLetters',
            function: function(value: string) {
                return /^[a-zA-ZÀ-ÖØ-öø-ÿ]+$/.test(value);
            }
        });

        return this;
    }

    hasLetters(min = 1) {
        this.checks.push({
            name: this.name + ' hasLetters ' + min,
            function: function(value: string) {
                if (typeof value != 'string') return false;

                let count = 0;

                for(let i = 0; i < value.length; ++i) {
                    if (/^[a-zA-ZÀ-ÖØ-öø-ÿ]+$/.test(value[i])) {
                        count += 1;

                        if (count >= min) {
                            return true;
                        }
                    }
                }

                return false;
            }
        });

        return this;
    }

    hasNotLetters() {
        this.checks.push({
            name: this.name + ' hasNotLetters',
            function: function(value: string) {
                if (typeof value != 'string') return true;

                for(let i = 0; i < value.length; ++i) {
                    if (/^[a-zA-ZÀ-ÖØ-öø-ÿ]+$/.test(value[i])) {
                        return false;
                    }
                }

                return true;
            }
        });

        return this;
    }

    isSpecialChars() {
        this.hasSpecialChars(-1);
        return this;
    }

    hasSpecialChars(min = 1) {
        this.checks.push({
            name: this.name + ' hasSpecialChars ' + min,
            function: function(value: string, param: number) {
                if (typeof value != 'string') return false;

                let count = 0;

                for(let i = 0; i < value.length; ++i) {
                    if (/[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(value[i])) {
                        count += 1;

                        if (param != -1 && count >= param) {
                            return true;
                        }
                    }
                }

                if (param == -1 && count == value.length) {
                    return true;
                }

                return false;
            },
            parameter: min
        });

        return this;
    }

    hasNotSpecialChars() {
        this.checks.push({
            name: this.name + ' hasNotSpecialChars',
            function: function(value: string) {
                if (typeof value != 'string') return true;

                for(let i = 0; i < value.length; ++i) {
                    if (/[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(value[i])) {
                        return false;
                    }
                }

                return true;
            }
        });

        return this;
    }

    isPhone() {

        this.checks.push({
            name: this.name + ' isPhone',
            function: function(value: string) {

                const v = "" + value;

                const valid = '+0123456789 -()';
                for(let i = 0; i < v.length; ++i) {
                    if (!valid.includes(v[i])) {
                        return false;
                    }
                }
                
                return true;
            }
        });

        return this;
    }

    isBool() {
        this.checks.push({
            name: this.name + ' isBool',
            function: function(value: boolean) {
                return typeof value == 'boolean'
            }
        });

        return this;
    }

    has(property: string) {
        this.checks.push({
            name: this.name + ' has ' + property,
            function: function(value: any, param: string) {
                return value[param] !== undefined;
            },
            parameter: property
        }); 

        return this;
    }

    notEmpty() {
        this.checks.push({
            name: this.name + ' notEmpty',
            function: function(value: any) {
                if (!value) return false;
                
                if (Array.isArray(value)) {
                    if (value.length == 0) return false;
                } else {
                    return !!value;
                }

                return true;
            }
        }); 

        return this;
    }

    rule(checker: (value: any) => boolean, name: string = 'rule') {
        this.checks.push({
            name: this.name + ' ' + name,
            function: checker
        });

        return this;
    }

    setInputError() {
        if (!this.formInput) return;
        if (this.error) {
            if (!this.errorMessage) return;
            this.formInput.localError = this.errorMessage;
        } else {
            this.formInput.localError = undefined;
        }
    }

    validate(setErrorMessages: boolean = true) {

        const validate = () => {
            if (this.value) {
                const v = this.value();
    
                for(const check of this.checks) {
    
                    const func = check['function'];
                    const param = check['parameter'];
        
                    const valid = func(v, param);
        
                    if (!valid) {
        
                        if (this.debugMode) {
                            console.log('FAILED: ' + check.name);
                        }
        
                        this.error = true;
                        if (setErrorMessages) this.setInputError();
                        return false;
                    }
        
                }
            }
    
            this.error = false;
            if (setErrorMessages) this.setInputError();
    
            for(const validator of Object.values(this.validators)) {
                if (!validator.validate(setErrorMessages)) {
                    return false;
                }
            }
    
            return true;
        }

        const result = validate();

        for(const callback of Object.values(this._callbacks)) {
            callback(result, setErrorMessages);
        }

        return result;
    }

}