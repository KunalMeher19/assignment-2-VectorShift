// draggableNode.js
import React from 'react';
import './draggableNode.css';

export const DraggableNode = ({ type, label, icon }) => {
    const onDragStart = (event, nodeType) => {
      const appData = { nodeType }
      event.target.style.cursor = 'grabbing';
      event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
      event.dataTransfer.effectAllowed = 'move';
    };

    return (
      <div
        className={`${type} draggable-node`}
        onDragStart={(event) => onDragStart(event, type)}
        onDragEnd={(event) => (event.target.style.cursor = 'grab')}
        draggable
      >
          <div className="draggable-node__content">
            {icon ? (
              <img
                src={icon}
                alt={`${label} icon`}
                className="draggable-node__icon"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                width={36}
                height={36}
                draggable={false}
              />
            ) : null}
            <span className="draggable-node__label">{label}</span>
          </div>
      </div>
    );
  };
