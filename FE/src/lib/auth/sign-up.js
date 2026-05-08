import { authClient } from './auth-client.js'

const unwrap = ({ data, error }) => {
    if (error) {
        throw new Error(error.message || 'Authentication failed')
    }

    return data
}

export const signUp = async (email, password, name) => {
    return unwrap(await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: '/',
    }))
}

export const signIn = async (email, password) => {
    return unwrap(await authClient.signIn.email({
        email,
        password,
        callbackURL: '/',
    }))
}

export const signOut = async () => {
    return unwrap(await authClient.signOut())
}

export const getSession = async () => {
    const { data, error } = await authClient.getSession()

    if (error?.status === 401) {
        return null
    }

    return unwrap({ data, error })
}
