/** One place for the site's identity, so metadata, manifest and sitemap agree. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

export const SITE_NAME = 'MaxWell'

export const SITE_TITLE = 'MaxWell · Rural Triage'

export const SITE_DESCRIPTION =
  'A rural triage intake built down a spinal cord: symptoms, vitals, history, the visit, a second read, and the record the desk keeps. Built for a primary health centre in Karnataka.'
