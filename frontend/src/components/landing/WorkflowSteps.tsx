import React, { useState } from 'react';
import './LandingStyles.css';

// Interface for a single workflow step item
interface WorkflowStepItem {
  id: number;
  icon: React.ElementType;
  title: string;
  shortDescription: string;
  detailedDescription: string;
}

// Interface for the component props
interface WorkflowStepsProps {
  workflowStepsData: WorkflowStepItem[];
}

const WorkflowSteps: React.FC<WorkflowStepsProps> = ({ workflowStepsData }) => {
  const [selectedStepId, setSelectedStepId] = useState<number | null>(
    workflowStepsData.length > 0 ? workflowStepsData[0].id : null
  );

  if (!workflowStepsData || workflowStepsData.length === 0) {
    return (
      <section className="py-16 bg-transparent">
        <p className="text-center text-slate-500">No workflow steps to display.</p>
      </section>
    );
  }

  const selectedStepDetails = workflowStepsData.find(s => s.id === selectedStepId);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-transparent relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-slate-800/40 backdrop-blur-xl rounded-full border border-slate-600/30">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-slate-300 text-sm font-medium tracking-wide">
              How It Works
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">
            Streamlined{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              workflow
            </span>
          </h2>
          
          <p className="text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed">
            Experience a clear path from project inception to successful delivery.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative mb-12">
          {/* Timeline Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 rounded-full -translate-y-1/2" />
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full -translate-y-1/2" />

          {/* Steps */}
          <div className="relative flex justify-between items-start">
            {workflowStepsData.map((step, _index) => (
              <div key={step.id} className="flex flex-col items-center text-center flex-1 px-2">
                <button
                  aria-label={`${step.title}: ${step.shortDescription}`}
                  onClick={() => setSelectedStepId(step.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 mb-4 ${
                    selectedStepId === step.id
                      ? 'bg-blue-500 border-blue-400 text-white scale-110'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400'
                  }`}
                >
                  <step.icon className="w-6 h-6" aria-hidden="true" />
                </button>
                
                <div className="text-center">
                  <h3 className={`font-semibold text-sm mb-1 ${
                    selectedStepId === step.id ? 'text-blue-300' : 'text-slate-300'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 hidden sm:block">
                    {step.shortDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Step Details */}
        <div className="max-w-4xl mx-auto">
          {selectedStepDetails && (
            <div
              key={selectedStepDetails.id}
              className="glass-card p-8 transition-opacity duration-400"
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                  <selectedStepDetails.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedStepDetails.title}
                </h3>
              </div>
              <p className="text-slate-300 leading-relaxed text-lg">
                {selectedStepDetails.detailedDescription}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSteps; 