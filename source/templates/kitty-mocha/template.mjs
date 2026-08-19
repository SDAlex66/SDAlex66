/**Template processor */
export default async function({q, plugins}, _, {imports}) {
  await imports.plugins.core(...arguments)
  if (plugins.pagespeed && plugins.pagespeed.error) {
    throw new Error(`PageSpeed API error`)
  }
  q.raw = true
}