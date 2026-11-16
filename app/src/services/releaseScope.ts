// Phase two remains available only to an explicitly enabled local development build.
// Production output is always limited to phase one, including administrator sessions.
export const phaseTwoEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_PHASE2 === 'true';

// Keep account development available locally while the public release is guest-only.
export const accountsEnabled = import.meta.env.DEV;
