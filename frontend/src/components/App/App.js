import { useState } from 'react';
import { PipelineToolbar } from '../Toolbar/toolbar';
import { PipelineUI } from '../UI/ui';
import './App.css';

function App() {
  const [toolbarOpen, setToolbarOpen] = useState(true);

  return (
    <div className="app app--with-toolbar">
      <div className={`app__toolbar ${toolbarOpen ? 'is-open' : 'is-closed'}`}>
        <PipelineToolbar isOpen={toolbarOpen} onClose={() => setToolbarOpen(false)} />
      </div>

      {/* Toggle button to open toolbar when closed */}
      <button
        className={`app__toolbar-toggle ${toolbarOpen ? 'hidden' : 'visible'}`}
        aria-label={toolbarOpen ? 'Close toolbar' : 'Open toolbar'}
        onClick={() => setToolbarOpen(true)}
      >
        +
      </button>

      <div className="app__content">
        <PipelineUI toolbarOpen={toolbarOpen} />
      </div>
    </div>
  );
}

export default App;
