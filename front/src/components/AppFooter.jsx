export default function AppFooter() {
  return (
    <footer className="sticky-footer bg-white">
      <div className="container my-auto">
        <div className="copyright text-center my-auto">
          <span>© {new Date().getFullYear()} Mi Dashboard</span>
        </div>
      </div>
    </footer>
  );
}
