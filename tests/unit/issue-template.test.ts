import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const read = (f: string) => parse(readFileSync(join(__dirname, '..', '..', '.github', 'ISSUE_TEMPLATE', f), 'utf8'))

type Field = { type: string; id?: string; attributes?: { options?: { required?: boolean }[] }; validations?: { required?: boolean } }

describe('submit-saln.yml', () => {
  const form = read('submit-saln.yml')
  const fields: Field[] = form.body
  const byId = (id: string) => fields.find((f) => f.id === id)!

  it('has the required top-level keys', () => {
    expect(form.name).toBeTruthy()
    expect(form.description).toBeTruthy()
    expect(form.title).toBe('[SALN submission] ')
    expect(form.labels).toEqual(['saln-submission'])
    expect(Array.isArray(form.body)).toBe(true)
  })
  it('never asks for uploads', () => {
    for (const f of fields) expect(['markdown', 'input', 'textarea', 'checkboxes', 'dropdown']).toContain(f.type)
    expect(JSON.stringify(form)).not.toMatch(/type:\s*upload/)
    expect(fields.some((f) => /upload|file/i.test(f.type))).toBe(false)
  })
  it('requires name, position, year and source; optional link and totals', () => {
    for (const id of ['official-name', 'position-lgu', 'saln-year', 'source']) {
      expect(byId(id).validations?.required, id).toBe(true)
    }
    for (const id of ['document-link', 'total-assets', 'total-liabilities', 'net-worth']) {
      expect(byId(id).validations?.required, id).toBe(false)
    }
  })
  it('has three required confirmations', () => {
    const opts = byId('confirmations').attributes!.options!
    expect(opts).toHaveLength(3)
    expect(opts.every((o) => o.required === true)).toBe(true)
  })
  it('points at the same template name the portal links to', () => {
    expect(JSON.stringify(form)).toContain('Links only')
  })
})

describe('config.yml', () => {
  const cfg = read('config.yml')
  it('disables blank issues and links to the Ombudsman page', () => {
    expect(cfg.blank_issues_enabled).toBe(false)
    expect(cfg.contact_links[0].url).toBe('https://www.ombudsman.gov.ph/request-for-copy-of-salns/')
  })
})
