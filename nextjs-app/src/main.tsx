import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <div className='bg-background text-foreground font-sans'>
        <div className="inner">
        <App />

        </div>

    </div>
);
