import { useState } from 'react';
import { Layout } from './components/Layout';
import { UploadView } from './components/UploadView';
import { JobsView } from './components/JobsView';
import { CandidatesView } from './components/CandidatesView';
import { AnalyticsView } from './components/AnalyticsView';
import { EmailsView } from './components/EmailsView';

function App() {
  const [currentView, setCurrentView] = useState('upload');

  const renderView = () => {
    switch (currentView) {
      case 'upload':
        return <UploadView />;
      case 'jobs':
        return <JobsView />;
      case 'candidates':
        return <CandidatesView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'emails':
        return <EmailsView />;
      default:
        return <UploadView />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;
