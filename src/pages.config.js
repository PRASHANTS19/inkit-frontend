import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import Research from './pages/Research';
import Calendar from './pages/Calendar';
import Billing from './pages/Billing';
import Documents from './pages/Documents';
import DocumentViewer from './pages/DocumentViewer';
import TeamManagement from './pages/TeamManagement';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Library from './pages/Library';
import ClientDashboard from './pages/ClientDashboard';
import ClientDocuments from './pages/ClientDocuments';
import Assignments from './pages/Assignments';
import Clients from './pages/Clients';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Cases": Cases,
    "Research": Research,
    "Calendar": Calendar,
    "Billing": Billing,
    "Documents": Documents,
    "DocumentViewer": DocumentViewer,
    "TeamManagement": TeamManagement,
    "Settings": Settings,
    "Notifications": Notifications,
    "Library": Library,
    "ClientDashboard": ClientDashboard,
    "ClientDocuments": ClientDocuments,
    "Assignments": Assignments,
    "Clients": Clients,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};