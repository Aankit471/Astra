# ASTRA API boundary

The frontend selects `mockApi` by default. Set `VITE_USE_MOCK_API=false` and provide `VITE_API_BASE_URL` to use the HTTP adapter when a backend is available.

The HTTP adapter expects backend endpoints for authentication, referrals, hospitals, notifications, and audit events. The backend remains the authority for authorization; frontend permission helpers only control UI access and demo actions.

No secrets belong in `VITE_*` variables. The current demo stores only its mock session in the browser.