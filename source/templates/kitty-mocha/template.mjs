/**Template processor */
export default async function({q}, _, {imports}) {
  await imports.plugins.core(...arguments)
  q.raw = true
}