import { Outlet } from "react-router-dom";
import MobileExperienceNotice from "@/components/ui/MobileExperienceNotice";

function Writing() {
  return (
    <MobileExperienceNotice>
      <Outlet />
    </MobileExperienceNotice>
  );
}

export default Writing;
