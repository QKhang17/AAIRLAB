/* Shared API client for the original HTML screens. */
window.AAIR = (() => {
    const base = (window.AAIR_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');
    const homes = {
        ADMIN: 'Admin', MANAGER: 'Manager', USER: 'User/Basic', AI_LABELER: 'User/AILabeling',
        MANUAL_LABELER: 'User/ManualLabeling', REVIEWER: 'User/ManualReview',
        RESULT_ANALYST: 'User/ResultAnalysis', TERMINOLOGY: 'User/Terminology',
    };
    const loginPath = '/main/HTML/Home/signIn.html';
    function loginUrl() {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        return `${loginPath}?returnTo=${encodeURIComponent(returnTo)}`;
    }
    function saveSession(_token, user) {
        // The access token is an HttpOnly cookie; only non-sensitive display data is cached.
        sessionStorage.removeItem('aair_access_token');
        localStorage.removeItem('aair_access_token');
        sessionStorage.removeItem('aair_user');
        localStorage.removeItem('aair_user');
        if (user) sessionStorage.setItem('aair_user', JSON.stringify(user));
    }
    function clearSession() {
        sessionStorage.removeItem('aair_access_token');
        localStorage.removeItem('aair_access_token');
        sessionStorage.removeItem('aair_user');
        localStorage.removeItem('aair_user');
    }
    function csrfToken() {
        const cookie = document.cookie.split('; ').find(value => value.startsWith('XSRF-TOKEN='));
        return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : '';
    }
    async function csrf() {
        const response = await fetch(base + '/auth/csrf', { credentials: 'include' });
        if (!response.ok) throw new Error('Cannot initialize CSRF protection.');
        return (await response.json().catch(() => null))?.data || csrfToken();
    }
    function logout() {
        csrf()
            .catch(() => null)
            .then(() => request('/auth/logout', { method: 'POST', suppressAuthRedirect: true }))
            .catch(() => null)
            .finally(() => { clearSession(); location.assign(loginPath); });
    }
    async function request(path, options = {}) {
        const { json, blob, suppressAuthRedirect, ...init } = options;
        const requestInit = { ...init, credentials: 'include' };
        const headers = new Headers(requestInit.headers);
        const method = String(requestInit.method || 'GET').toUpperCase();
        const token = csrfToken();
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && token) headers.set('X-XSRF-TOKEN', token);
        if (json !== undefined) {
            headers.set('Content-Type', 'application/json');
            requestInit.body = JSON.stringify(json);
        }
        let response;
        try {
            response = await fetch(base + path, { ...requestInit, headers });
        } catch {
            throw new Error('Cannot connect to API server. Please check backend and network connection.');
        }
        if (response.ok) {
            if (blob) return response.blob();
            const body = await response.json().catch(() => null);
            return body?.data;
        }
        const body = await response.json().catch(() => null);
        if (response.status === 401 && path !== '/auth/login' && !suppressAuthRedirect) {
            clearSession();
            location.replace(loginUrl());
        }
        const error = new Error(body?.message || `Request failed (${response.status || 0}).`);
        error.status = response.status;
        throw error;
    }
    function home(role) {
        if (!homes[role]) throw new Error('Account role is not supported.');
        return `/main/HTML/${homes[role]}/Dashboard.html`;
    }
    function assetUrl(path) {
        if (!path) return '';
        if (/^(?:https?:|data:|blob:)/i.test(path)) return path;
        const apiUrl = new URL(base, location.href);
        return `${apiUrl.origin}${path.startsWith('/') ? path : `/${path}`}`;
    }
    async function guard() {
        let user;
        try {
            user = await request('/auth/me');
        } catch (error) {
            if (error?.status === 401 || error?.status === 403) return null;
            throw error;
        }
        if (!user || !homes[user.role]) {
            clearSession();
            location.replace(loginUrl());
            return null;
        }
        const directory = `/main/HTML/${homes[user.role]}/`;
        if (!location.pathname.startsWith(directory)) {
            location.replace(home(user.role));
            return null;
        }
        sessionStorage.setItem('aair_user', JSON.stringify(user));
        return user;
    }
    return { request, csrf, assetUrl, home, guard, logout, clearSession, saveSession };
})();
