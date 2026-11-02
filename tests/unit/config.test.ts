import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import portalConfig from '../../portal.config'

describe('portalConfig', () => {
  it('targets the Bukidnon PSGC province code', () => {
    expect(portalConfig.provincePsgc).toBe('1001300000')
    expect(portalConfig.provinceName).toBe('Bukidnon')
  })
  it('matches the province node in the real data/geo.json', () => {
    const geo = JSON.parse(readFileSync(join(__dirname, '..', '..', 'data', 'geo.json'), 'utf8'))
    const prov = geo.nodes.find((n: { type: string }) => n.type === 'province')
    expect(prov.psgc).toBe(portalConfig.provincePsgc)
  })
  it('points to the Ombudsman request page and main site', () => {
    expect(portalConfig.ombudsmanRequestUrl).toBe('https://www.ombudsman.gov.ph/request-for-copy-of-salns/')
    expect(portalConfig.mainSiteUrl).toBe('https://betterbukidnon.org')
  })
  it('carries the aggregator disclaimer', () => {
    expect(portalConfig.disclaimer).toContain('not an official government website')
  })
})
