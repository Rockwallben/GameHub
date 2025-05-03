import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Gamepad2, Github } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Game Hub</span>
          </Link>
          
          <nav className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <a 
                href="https://github.com/yourrepo" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                Source
              </a>
            </Button>
          </nav>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Game Hub. All games are implemented in React.</p>
          <p className="mt-2">Play classic browser games with modern UI and score tracking.</p>
        </div>
      </footer>
    </div>
  );
}
