/**
 * Meeting Provider Interface (Prompt 011).
 * Core LiveClass stores provider + link; adapters can create/update meetings later
 * without changing Live Class CRUD.
 */
const { MEETING_PROVIDERS } = require('../constants/live-class')

class MeetingProviderAdapter {
  constructor(providerId) {
    this.providerId = providerId
  }

  /** @returns {Promise<{ meetingId, joinUrl, password, meta }>} */
  async createMeeting(_payload) {
    throw new Error('Not implemented')
  }

  async updateMeeting(_externalId, _payload) {
    throw new Error('Not implemented')
  }

  async cancelMeeting(_externalId) {
    return { cancelled: true }
  }

  async getJoinInfo(classDoc) {
    return {
      provider: this.providerId,
      joinUrl: classDoc.meetingLink || '',
      password: classDoc.meetingPassword || '',
      meetingId: classDoc.externalMeetingId || '',
    }
  }
}

class ExternalLinkAdapter extends MeetingProviderAdapter {
  constructor() {
    super(MEETING_PROVIDERS.EXTERNAL_LINK)
  }

  async createMeeting(payload) {
    return {
      meetingId: `ext-${Date.now()}`,
      joinUrl: payload.meetingLink || '',
      password: payload.meetingPassword || '',
      meta: { mode: 'external_link' },
    }
  }

  async updateMeeting(externalId, payload) {
    return {
      meetingId: externalId,
      joinUrl: payload.meetingLink || '',
      password: payload.meetingPassword || '',
      meta: {},
    }
  }
}

class ZoomAdapterStub extends MeetingProviderAdapter {
  constructor() {
    super(MEETING_PROVIDERS.ZOOM)
  }

  async createMeeting(payload) {
    // Architecture-ready: integrate Zoom API later
    return {
      meetingId: `zoom-stub-${Date.now()}`,
      joinUrl: payload.meetingLink || 'https://zoom.us/j/pending',
      password: payload.meetingPassword || '',
      meta: { stub: true, provider: 'zoom' },
    }
  }
}

class GoogleMeetAdapterStub extends MeetingProviderAdapter {
  constructor() {
    super(MEETING_PROVIDERS.GOOGLE_MEET)
  }

  async createMeeting(payload) {
    return {
      meetingId: `meet-stub-${Date.now()}`,
      joinUrl: payload.meetingLink || 'https://meet.google.com/pending',
      password: '',
      meta: { stub: true, provider: 'google_meet' },
    }
  }
}

class TeamsAdapterStub extends MeetingProviderAdapter {
  constructor() {
    super(MEETING_PROVIDERS.MICROSOFT_TEAMS)
  }

  async createMeeting(payload) {
    return {
      meetingId: `teams-stub-${Date.now()}`,
      joinUrl: payload.meetingLink || 'https://teams.microsoft.com/l/meetup-join/pending',
      password: '',
      meta: { stub: true, provider: 'microsoft_teams' },
    }
  }
}

class CustomVideoAdapterStub extends MeetingProviderAdapter {
  constructor() {
    super(MEETING_PROVIDERS.CUSTOM)
  }

  async createMeeting(payload) {
    return {
      meetingId: `custom-${Date.now()}`,
      joinUrl: payload.meetingLink || '',
      password: payload.meetingPassword || '',
      meta: { stub: true, provider: 'custom' },
    }
  }
}

const registry = {
  [MEETING_PROVIDERS.NONE]: new ExternalLinkAdapter(),
  [MEETING_PROVIDERS.EXTERNAL_LINK]: new ExternalLinkAdapter(),
  [MEETING_PROVIDERS.ZOOM]: new ZoomAdapterStub(),
  [MEETING_PROVIDERS.GOOGLE_MEET]: new GoogleMeetAdapterStub(),
  [MEETING_PROVIDERS.MICROSOFT_TEAMS]: new TeamsAdapterStub(),
  [MEETING_PROVIDERS.CUSTOM]: new CustomVideoAdapterStub(),
}

function getMeetingProvider(providerId) {
  return registry[providerId] || registry[MEETING_PROVIDERS.EXTERNAL_LINK]
}

module.exports = {
  MeetingProviderAdapter,
  getMeetingProvider,
  registry,
}
