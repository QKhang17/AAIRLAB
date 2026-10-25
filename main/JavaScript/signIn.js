function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggle = document.getElementById('passwordToggle');
    const visible = passwordInput.type === 'password';
    passwordInput.type = visible ? 'text' : 'password';
    toggle.textContent = visible ? 'Hide' : 'Show';
    toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    toggle.setAttribute('aria-pressed', String(visible));
}

// Authenticate the existing sign-in form against Spring Boot.
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalContent = btn.innerHTML;

    btn.disabled = true;
    btn.textContent = 'Signing in…';
    e.target.setAttribute('aria-busy', 'true');
    btn.classList.add('opacity-80');

    let error = document.getElementById('loginError');
    if (!error) {
        error = document.createElement('p');
        error.id = 'loginError';
        error.className = 'text-sm text-red-600';
        error.setAttribute('role', 'alert');
        btn.before(error);
    }
    error.textContent = '';
    try {
        // A fresh login must never inherit an expired token from an older tab.
        AAIR.clearSession();
        const result = await AAIR.request('/auth/login', { method: 'POST', json: {
            username: document.getElementById('username').value.trim(),
            password: document.getElementById('password').value,
        } });
        const requestedPath = new URLSearchParams(location.search).get('returnTo');
        const sameOriginPath = requestedPath && requestedPath.startsWith('/main/HTML/')
            ? requestedPath
            : null;
        const destination = sameOriginPath || AAIR.home(result.user.role);
        AAIR.saveSession(result.accessToken, result.user);
        location.assign(destination);
    } catch (reason) {
        error.textContent = reason.message;
    } finally {
        btn.disabled = false;
        e.target.removeAttribute('aria-busy');
        btn.innerHTML = originalContent;
        btn.classList.remove('opacity-80');
    }
});
