import { NavLink } from "react-router-dom";

const features = [
  {
    icon: "📝",
    title: "Mock Test",
    description:
      "Simulate real IELTS exam conditions and test your writing under timed pressure.",
    path: "/mock",
  },
  {
    icon: "🎯",
    title: "Focused Practice",
    description:
      "Practice specific Task 1 and Task 2 questions in a distraction-free environment.",
    path: "/practice",
  },
  {
    icon: "🛋️",
    title: "Relax Mode",
    description:
      "Write freely without a timer. Build confidence and enjoy the process.",
    path: "/relax",
  },
];

function FeatureCards() {
  return (
    <div className="grid max-w-5xl grid-cols-3 gap-6 px-6 py-16 mx-auto">
      {features.map((feature) => (
        <NavLink
          to={feature.path}
          key={feature.title}
          className="flex flex-col gap-4 p-6 border bg-card hover:shadow-md border-border rounded-2xl"
        >
          <span className="text-3xl">{feature.icon}</span>
          <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
          <p className="text-sm -foreground">{feature.description}</p>
        </NavLink>
      ))}
    </div>
  );
}

export default FeatureCards;
