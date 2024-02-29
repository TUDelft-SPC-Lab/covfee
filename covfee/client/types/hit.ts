import { HitSpec } from "@covfee-spec/hit"
import { NodeType } from "./node"
// export { NodeType };
import { JourneyType as FullJourneyType } from "./journey"

export type HitType = Omit<HitSpec, "nodes" | "journeys"> & {
  nodespecs: NodeType[]
  journeyspecs: number[]

  generator_url: string
}

// extends the specs with all the covfee-added fields
export interface JourneyType extends Omit<FullJourneyType, "nodes"> {
  nodes: number[]
}
export type HitInstanceType = Omit<HitSpec, "nodes"> & {
  api_url: string
  nodes: NodeType[]
  journeys: JourneyType[]
  created_at: string
  updated_at: string
  submitted_at: string
}
