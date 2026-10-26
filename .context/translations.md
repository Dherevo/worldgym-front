To insert a translation in layout use: <div>{{ $t('translation.key.path') }}</div>

Translations are located in /src/assets/translations. There is a ts file for each language: es.ts, en.ts ... When adding a translation, please add it in all languages.

The desired structure for translations is by model or module. Example:

{
    auth: {
        login: 'Sign In',
        logout: 'Log out'
    },
    users: {
        singular: 'User',
        plural: 'Users',
        create: 'Create user',
        delete: {
            title: 'Delete user',
            confirm: 'Are you sure want to delete this user?',
            success: 'This user was deleted',
            error: 'The user could '
        }
    }
}

do NOT use redundant keys like: users: { createUser: 'Create user' }
use instead: users: { create: 'Create user' }