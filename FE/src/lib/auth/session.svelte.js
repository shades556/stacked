import { player } from '../../Pages/Player.svelte.js'
import { connectionState } from '../../Socket.svelte.js'
import { getSession, signIn, signOut, signUp } from './sign-up.js'

export const sessionState = $state({
    session: null,
    user: null,
    loading: true,
    error: null,

    get isAuthenticated() {
        return Boolean(this.user)
    },

    apply(session) {
        this.session = session?.session ?? null
        this.user = session?.user ?? null

        if (this.user) {
            player.player_id = this.user.id
            player.username = this.user.name || this.user.email || 'Player'
        }
    },

    async refresh() {
        this.loading = true
        this.error = null

        try {
            this.apply(await getSession())
        } catch (err) {
            this.apply(null)
            this.error = err.message || 'Failed to load session'
        } finally {
            this.loading = false
        }

        return this.session
    },

    async signUp(email, password, name) {
        this.loading = true
        this.error = null

        try {
            await signUp(email, password, name)
            await this.refresh()
        } catch (err) {
            this.error = err.message || 'Sign up failed'
            throw err
        } finally {
            this.loading = false
        }
    },

    async signIn(email, password) {
        this.loading = true
        this.error = null

        try {
            await signIn(email, password)
            await this.refresh()
        } catch (err) {
            this.error = err.message || 'Sign in failed'
            throw err
        } finally {
            this.loading = false
        }
    },

    async signOut() {
        this.loading = true
        this.error = null

        try {
            await signOut()
            this.apply(null)
            connectionState.disconnectAll()
        } catch (err) {
            this.error = err.message || 'Sign out failed'
            throw err
        } finally {
            this.loading = false
        }
    }
})
