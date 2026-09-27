import data from './data.json'
import { Demo } from './demo/demo'
import type { Data } from './types'

// The demo shell. Criteria, the pipeline in real per-market numbers, the list, and the three
// integration views behind tabs. Every number comes from out/pipeline.json and out/creators.json.
export default function Page() {
  return <Demo d={data as unknown as Data} />
}
