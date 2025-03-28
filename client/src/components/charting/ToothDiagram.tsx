import React from "react";

interface ToothSurface {
  occlusal?: boolean;
  buccal?: boolean;
  lingual?: boolean;
  mesial?: boolean;
  distal?: boolean;
  [key: string]: boolean | undefined;
}

interface Tooth {
  number: number;
  surfaces: ToothSurface;
  hasRootCanal?: boolean;
  hasPostCore?: boolean;
  hasCrown?: boolean;
  missing?: boolean;
}

interface ToothDiagramProps {
  tooth: Tooth;
  onClickSurface: (surface: keyof ToothSurface) => void;
  onSelect: () => void;
}

export const ToothDiagram: React.FC<ToothDiagramProps> = ({
  tooth,
  onClickSurface,
  onSelect,
}) => {
  const { surfaces, hasRootCanal, hasPostCore, hasCrown, missing } = tooth;

  // Get classes based on treatment status
  const getToothClasses = () => {
    const classes = ["tooth-container"];
    if (hasRootCanal) classes.push("has-root-canal");
    if (hasPostCore) classes.push("has-post-core");
    if (hasCrown) classes.push("has-crown");
    if (missing) classes.push("is-missing");
    return classes.join(" ");
  };

  return (
    <div 
      className={`relative border rounded-md p-2 cursor-pointer hover:bg-gray-50 ${missing ? 'bg-gray-200' : ''}`}
      onClick={onSelect}
    >
      <div className="text-xs font-semibold text-center mb-1">#{tooth.number}</div>
      
      {/* Tooth diagram */}
      <div className="aspect-square w-full grid grid-cols-3 gap-1">
        {/* Top row */}
        <div 
          className={`col-start-2 bg-gray-100 rounded ${surfaces.occlusal ? 'bg-blue-500' : ''}`}
          onClick={(e) => { e.stopPropagation(); onClickSurface('occlusal'); }}
        ></div>
        
        {/* Middle row */}
        <div 
          className={`bg-gray-100 rounded ${surfaces.mesial ? 'bg-blue-500' : ''}`}
          onClick={(e) => { e.stopPropagation(); onClickSurface('mesial'); }}
        ></div>
        <div 
          className="relative"
        >
          {hasRootCanal && <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs">RC</div>}
          {hasCrown && <div className="absolute inset-0 border-2 border-yellow-500 rounded-full"></div>}
        </div>
        <div 
          className={`bg-gray-100 rounded ${surfaces.distal ? 'bg-blue-500' : ''}`}
          onClick={(e) => { e.stopPropagation(); onClickSurface('distal'); }}
        ></div>
        
        {/* Bottom row */}
        <div 
          className={`bg-gray-100 rounded ${surfaces.lingual ? 'bg-blue-500' : ''}`}
          onClick={(e) => { e.stopPropagation(); onClickSurface('lingual'); }}
        ></div>
        <div 
          className={`bg-gray-100 rounded ${surfaces.buccal ? 'bg-blue-500' : ''}`}
          onClick={(e) => { e.stopPropagation(); onClickSurface('buccal'); }}
        ></div>
        <div></div>
      </div>
      
      {missing && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75">
          <div className="text-red-500 font-bold">X</div>
        </div>
      )}
    </div>
  );
};