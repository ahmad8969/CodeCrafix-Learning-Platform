/**
 * Plugin registry — enable/disable per institute from Admin Panel.
 */
const PLUGINS = Object.freeze({
  zoom: {
    id: 'zoom',
    label: 'Zoom',
    category: 'live_class',
    status: 'planned',
    enabledByDefault: false,
  },
  google_meet: {
    id: 'google_meet',
    label: 'Google Meet',
    category: 'live_class',
    status: 'planned',
    enabledByDefault: false,
  },
  stripe: {
    id: 'stripe',
    label: 'Stripe',
    category: 'payments',
    status: 'planned',
    enabledByDefault: false,
  },
  jazzcash: {
    id: 'jazzcash',
    label: 'JazzCash',
    category: 'payments',
    status: 'planned',
    enabledByDefault: false,
  },
  easypaisa: {
    id: 'easypaisa',
    label: 'EasyPaisa',
    category: 'payments',
    status: 'planned',
    enabledByDefault: false,
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    category: 'messaging',
    status: 'planned',
    enabledByDefault: false,
  },
  email: {
    id: 'email',
    label: 'Email',
    category: 'messaging',
    status: 'active',
    enabledByDefault: true,
  },
  sms: {
    id: 'sms',
    label: 'SMS',
    category: 'messaging',
    status: 'planned',
    enabledByDefault: false,
  },
  google_drive: {
    id: 'google_drive',
    label: 'Google Drive',
    category: 'storage',
    status: 'planned',
    enabledByDefault: false,
  },
  onedrive: {
    id: 'onedrive',
    label: 'OneDrive',
    category: 'storage',
    status: 'planned',
    enabledByDefault: false,
  },
})

function listPlugins() {
  return Object.values(PLUGINS)
}

module.exports = { PLUGINS, listPlugins }
