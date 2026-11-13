// Fills {placeholders} in a message template: fill('Hi {name}', { name: 'Ana' }) -> 'Hi Ana'.
// Templates are kept so screens can translate the template and the values separately.
export const fill = (template, params = {}) => String(template).replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m))
