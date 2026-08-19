/**Template processor */
export default async function(args, _, {imports}) {
  await imports.plugins.core(...arguments)
  if (args.plugins?.pagespeed?.error) {
    throw new Error(`PageSpeed API error`)
  }
  args.q.raw = true
}