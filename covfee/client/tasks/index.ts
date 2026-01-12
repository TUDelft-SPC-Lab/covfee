import { TaskExport } from "types/node"
import ContinuousAnnotationTask from "./continuous_annotation"
import IncrementCounterTask from "./increment_counter"
import IngroupAnnotationTask from "./ingroup_annotation"
import InstructionsTask from "./instructions"
import QuestionnaireTask from "./questionnaire"
import TutorialTask from "./tutorial"
import VideocallTask from "./videocall"

// these will be available in source code:
export {
  ContinuousAnnotationTask, IncrementCounterTask, IngroupAnnotationTask, InstructionsTask,
  QuestionnaireTask,
  TutorialTask,
  VideocallTask
}

// these will be visible to the covfee interface:
export default {
  QuestionnaireTask,
  InstructionsTask,
  IncrementCounterTask,
  VideocallTask,
  TutorialTask,
  ContinuousAnnotationTask,
  IngroupAnnotationTask,
} as Record<string, TaskExport>

