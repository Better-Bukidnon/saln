import { describe, expect, it } from 'vitest'
import portalConfig from '../../portal.config'

describe('portalConfig', () => {
  it('targets the Bukidnon PSGC province code', () => {
    expect(portalConfig.provincePsgc).toBe('1013000000')
    expect(portalConfig.provinceName).toBe('Bukidnon')
  })
  it('points to the Ombudsman request page and main site', () => {
    expect(portalConfig.ombudsmanRequestUrl).toBe('https://www.ombudsman.gov.ph/request-for-copy-of-salns/')
    expect(portalConfig.mainSiteUrl).toBe('https://betterbukidnon.org')
  })
  it('carries the aggregator disclaimer', () => {
    expect(portalConfig.disclaimer).toContain('not an official government website')
  })
})
