import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Graphics from "./pages/Graphics";
import NotFound from "./pages/NotFound";
import Resume from "./pages/Resume";
import { AboutPage, ContactPage, ProjectsPage, SkillsPage, TrainingPage } from "./pages/SheunPages";

function Router() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = (value: string) => `${base}${value}` || "/";
  return (
    <Switch>
      <Route path={path("/")} component={Home} />
      <Route path={path("/admin")} component={Admin} />
      <Route path={path("/designs")} component={Graphics} />
      <Route path={path("/designs/")} component={Graphics} />
      <Route path={path("/graphics.html")}>
        <Redirect to={path("/designs")} />
      </Route>
      <Route path={path("/resume")} component={Resume} />
      <Route path={path("/resume.html")} component={Resume} />
      <Route path={path("/about.html")} component={AboutPage} />
      <Route path={path("/skills.html")} component={SkillsPage} />
      <Route path={path("/projects.html")} component={ProjectsPage} />
      <Route path={path("/training.html")} component={TrainingPage} />
      <Route path={path("/contact.html")} component={ContactPage} />
      <Route path={path("/404")} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}
