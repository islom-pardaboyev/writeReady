import { Card } from "../ui/card";

function WritingTask2Preview({ task2 }: { task2: string }) {
  return (
    <div>
      <p>Write about the following topic:</p>
      <Card className="bg-transparent! border border-gray-300 rounded ring-0! my-6 p-6 shadow-none shadow-slate-200">
        <b className="text-lg text-muted-foreground">{task2}</b>
      </Card>
        <p>
        Give reasons for your answer and include relevant examples from your own
        knowledge or experience.
      </p>
    </div>
  );
}

export default WritingTask2Preview;
