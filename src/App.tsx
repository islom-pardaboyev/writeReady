import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import {
  Home,
  Practice,
  Mock,
  Relax,
  NotFound,
  Writing,
  Listening,
  Reading,
  Feedback,
  Pricing,
  UserAccount,
} from "./pages";
import Admin from "./pages/admin";
import ReportView from "./pages/dashboard/report/ReportView";
import Header from "./components/header/Header";
import MaintenancePage from "./components/maintenancePage/maintenancePage";

const siteUrl = "https://writeready.uz";

function App() {
  const location = useLocation();
  const shouldShowHeader =
    !location.pathname.startsWith("/writing") &&
    !location.pathname.startsWith("/admin");

  useEffect(() => {
    const pageMeta: Record<string, { title: string; description: string }> = {
      "/": {
        title: "WriteReady | IELTS Writing Simulator & Practice",
        description:
          "WriteReady is an IELTS writing simulator and practice platform for Task 1 and Task 2. Practice mock exams, improve your writing, and track your progress.",
      },
      "/writing": {
        title: "Writing Section | WriteReady",
        description:
          "Explore IELTS writing tasks, mock exam mode, and practice mode on WriteReady.",
      },
      "/writing/mock": {
        title: "Mock Exam | WriteReady",
        description:
          "Take timed IELTS writing mock exams and download your answers as a PDF on WriteReady.",
      },
      "/writing/practice": {
        title: "Practice Mode | WriteReady",
        description:
          "Practice IELTS Task 1 and Task 2 writing questions with guided support on WriteReady.",
      },
      "/writing/relax": {
        title: "Relax Mode | WriteReady",
        description:
          "Use WriteReady’s relaxed writing mode to practice at your own pace without pressure.",
      },
      "/listening": {
        title: "Listening Practice | WriteReady",
        description:
          "Improve your listening skills with focused IELTS listening practice on WriteReady.",
      },
      "/reading": {
        title: "Reading Practice | WriteReady",
        description:
          "Build your reading comprehension and speed with structured practice on WriteReady.",
      },
    };

    const meta = pageMeta[location.pathname] ?? pageMeta["/"];

    document.title = meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", meta.description);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", meta.title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", meta.description);
    document
      .querySelector('meta[property="og:url"]')
      ?.setAttribute("content", `${siteUrl}${location.pathname}`);
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", `${siteUrl}${location.pathname}`);
  }, [location.pathname]);
  const underMaintenance = false;
  return underMaintenance ? (
    <MaintenancePage />
  ) : (
    <main className="min-h-screen">
      {shouldShowHeader && <Header />}
      <Routes>
        <Route index element={<Home />} />
        {/* Writing Section */}
        <Route path="/writing" element={<Writing />}>
          <Route index element={<Mock />} />
          <Route path="mock" element={<Mock />} />
          <Route path="practice" element={<Practice />} />
          <Route path="relax" element={<Relax />} />
        </Route>
        <Route path="/listening" element={<Listening />} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/feedback/:report" element={<Feedback />} />
        <Route path="/report/:reportId" element={<ReportView />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/user-account" element={<UserAccount />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
}

export default App;
