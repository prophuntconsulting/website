import { defineCliConfig } from 'sanity/cli'
import { projectId, dataset } from './env'

export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: 'prophunt',
  deployment: { appId: 'lnpul1st9r396nf5sgo70c8o' },
})
