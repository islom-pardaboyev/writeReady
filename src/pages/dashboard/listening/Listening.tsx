import NotesCompletion from "@/components/listeningQuestionTypes/NotesCompletion";
import MobileExperienceNotice from "@/components/ui/MobileExperienceNotice";
// @ts-ignore - no declaration file for this JS data module
import question from "../../../data/listening/cam16_test1";

function Listening() {
  return (
    <MobileExperienceNotice>
      <div>
        <NotesCompletion data={question[0]} />
      </div>
    </MobileExperienceNotice>
  );
}

export default Listening;
