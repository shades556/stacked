
import Home from './Pages/Home.svelte'
import Collection from './Pages/Collection.svelte'
import Match from './Pages/Match.svelte'





export const routes = [
    {
        path: '/',
        component: Home,
        hooks: {
            pre: async (route) => {
                return  true
            },
        }
    },
    {
        path: '/collection',
        component: Collection,
        hooks: {
            pre: async (route) => {
                return  true
            },
        }
    },    {
        path: '/match',
        component: Match,
        hooks: {
            pre: async (route) => {
                return  true
            },
        }
    },

]
