import { PipelineToolbar } from '../Toolbar/toolbar';
import { PipelineUI } from '../UI/ui';
import { SubmitButton } from '../Submit/submit';

function App() {
  return (
    <div>
      <PipelineToolbar />
      <PipelineUI />
      <SubmitButton />
    </div>
  );
}

export default App;
