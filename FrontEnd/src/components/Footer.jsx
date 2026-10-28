import '../site.css';
import '@tailwindcss/vite';

export default function Footer() {
  return (
    // <footer>
    //   <div className="border border-amber-700 border-2">
    //     <span>
    //       Shop<span className="brand-dot">.</span>
    //     </span>
    //     <span>Thoughtful finds. Simple checkout.</span>
    //   </div>
    // </footer>
    <footer>
      <div className="container d-flex justify-content-between flex-wrap gap-2">
        <span>
          Shop<span className="brand-dot">.</span>
        </span>
        <span>Thoughtful finds. Simple checkout.</span>
      </div>
    </footer>
  );
}
