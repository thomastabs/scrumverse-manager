import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectLayout from './components/layout/ProjectLayout';
import ProjectDetails from './pages/ProjectDetails';
import ProjectEdit from './pages/ProjectEdit';
import ProjectBacklog from './pages/ProjectBacklog';
import ProjectTimeline from './pages/ProjectTimeline';
import ProjectBurndown from './pages/ProjectBurndown';
import ProjectCollaborators from './pages/ProjectCollaborators';
import AddTaskModal from './components/task/AddTaskModal';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
            <Route path="/projects/:projectId" element={<PrivateRoute><ProjectLayout /></PrivateRoute>}>
              <Route index element={<ProjectDetails />} />
              <Route path="edit" element={<ProjectEdit />} />
              <Route path="backlog" element={<ProjectBacklog />} />
              <Route path="timeline" element={<ProjectTimeline />} />
              <Route path="burndown" element={<ProjectBurndown />} />
              <Route path="collaborators" element={<ProjectCollaborators />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <AddTaskModal />
        </Router>
      </ProjectProvider>
    </AuthProvider>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return !user ? <>{children}</> : <Navigate to="/" />;
};

export default App;
