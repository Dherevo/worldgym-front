
const menuItems : ($router: any) => Promise<{
    label: string,
    icon: string,
    class: string,
    to?: string
    onClick?: () => void,
}[]>
= () => Promise.resolve([
        {
            label: 'Dashboard',
            icon: 'prime/home',
            to: '/',
            class: location.pathname == '/' ? 'active' : ''
        },
        {
            label: 'Exercicis',
            icon: 'prime/bolt',
            to: '/exercises',
            class: location.pathname == '/exercises' ? 'active' : ''
        },
        {
            label: 'Rutines',
            icon: 'prime/calendar',
            to: '/routines',
            class: location.pathname == '/routines' ? 'active' : ''
        },
        {
            label: 'Historial',
            icon: 'prime/history',
            to: '/workouts',
            class: location.pathname == '/workouts' ? 'active' : ''
        }
    ]);
export default menuItems;
