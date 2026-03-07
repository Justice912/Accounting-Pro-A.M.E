import { ListOrdered, ChevronRight } from 'lucide-react';

export default function WorkflowIndicator({ workflow }) {
  if (!workflow) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg px-4 py-2.5 mx-4 mt-2 flex items-center gap-3">
      <div className="bg-amber-100 rounded-md p-1.5">
        <ListOrdered className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-amber-800">
            {workflow.name}
          </span>
          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
            {workflow.stepCount} steps
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
    </div>
  );
}
