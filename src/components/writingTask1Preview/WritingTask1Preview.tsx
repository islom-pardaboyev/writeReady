import { Card } from "@/components/ui/card";

function WritingTask1Preview({
  task1,
}: {
  task1: { image: string; report: string };
}) {
  return (
    

    <Card className="bg-transparent! ring-0! rounded-none p-0 shadow-none shadow-slate-200">
      <div className="p-4 space-y-4 bg-white border border-gray-300 rounded">
        <p className="font-bold text-lg text-muted-foreground">{task1.report}</p>
        
        <p className="font-bold text-lg text-muted-foreground">
          Summarise the information by selecting and reporting the main features, and make comparisons where relevant.
        </p>
      </div>
      <img
        src={task1.image}
        alt="Task 1 preview"
        className="max-h-[600px]! mr-auto object-contain"
      />
    </Card>
  );
}

export default WritingTask1Preview;
