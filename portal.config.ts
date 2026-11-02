const repoUrl = 'https://github.com/Better-Bukidnon/saln'

const portalConfig = {
  provinceName: 'Bukidnon',
  provincePsgc: '1001300000',
  disclaimer: 'Aggregator, not the original source; not an official government website.',
  ombudsmanRequestUrl: 'https://www.ombudsman.gov.ph/request-for-copy-of-salns/',
  repoUrl,
  submitUrl: `${repoUrl}/issues/new?template=submit-saln.yml`,
  mainSiteUrl: 'https://betterbukidnon.org',
  volunteerEmail: 'volunteer@betterbukidnon.org',
  hashtags: '#OpenSALN #PublicSALNNow',
  // Footer links
  betterGovUrl: 'https://bettergov.ph/',
  betterGovSalnUrl: 'https://saln.bettergov.ph/',
  openHalalanUrl: 'https://robertrleung.github.io/OpenHalalan/',
  designCreditUrl: 'https://github.com/JHNLWHD/saln-tracker-ph',
  ombudsmanUrl: 'https://www.ombudsman.gov.ph/',
} as const

export default portalConfig
