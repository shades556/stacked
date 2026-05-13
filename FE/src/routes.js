import Home from './Pages/Home/Home.svelte'
import Collection from './Pages/Collection.svelte'
import Match from './Pages/Match/Match.svelte'
import Login from './Pages/Auth/Login.svelte'
import SignUp from './Pages/Auth/Signup.svelte'
import { sessionState } from './lib/auth/session.svelte.js'
import { goto } from '@mateothegreat/svelte5-router'


const canAccess = async () => {
    await sessionState.refresh()
    let gotUser = sessionState.isAuthenticated
    console.log('gotUser', gotUser)
    if ( ! gotUser) goto('/login')
    return gotUser
}


export const routes = [

    {
        path: '/login',
        component: Login,
        hooks: {

        }
    },
    {
        path: '/sign-up',
        component: SignUp,
        hooks: {

        }
    },

    {
        path: '/',
        component: Home,
        hooks: {
            pre: canAccess,
        }
    },
    {
        path: '/collection',
        component: Collection,
        hooks: {
            pre: canAccess,
        }
    },
    {
        path: '/match',
        component: Match,
        hooks: {
            pre: canAccess,
        }
    },

]
