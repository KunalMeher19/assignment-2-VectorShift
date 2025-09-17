import { PipelineToolbar } from '../Toolbar/toolbar';
import { PipelineUI } from '../UI/ui';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="app__toolbar">
        <PipelineToolbar />
      </div>
      <div className="app__content">
        <PipelineUI />
      </div>
    </div>
  );
}

export default App;
