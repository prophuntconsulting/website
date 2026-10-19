import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { projectId, dataset } from './env'

export default defineConfig({
  name: 'default',
  title: 'PROPHUNT LLP',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: S => S.list().title('Content').items([
        S.documentTypeListItem('property').title('Property Listings'),
        S.documentTypeListItem('blogPost').title('Blog Posts'),
      ]),
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
})
