// Phase two remains available only to an explicitly enabled local development build.
// Production output is always limited to phase one, including administrator sessions.
export const phaseTwoEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_PHASE2 === 'true';
