import { useState } from "react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ul
      className={`navbar-nav bg-gradient-primary sidebar sidebar-dark accordion ${
        collapsed ? "toggled" : ""
      }`}
      id="accordionSidebar"
      style={{ minHeight: "100vh" }}
    >
      {/* Brand */}
      <a
        className="sidebar-brand d-flex align-items-center justify-content-center"
        href="#"
      >
        <div className="sidebar-brand-icon rotate-n-15">
          <i className="fas fa-laugh-wink"></i>
        </div>
        <div className="sidebar-brand-text mx-3">SB Admin 2</div>
      </a>

      <hr className="sidebar-divider my-0" />

      {/* Items */}
      <li className="nav-item">
        <a className="nav-link" href="#">
          <i className="fas fa-fw fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </a>
      </li>

      <li className="nav-item">
        <a className="nav-link" href="#">
          <i className="fas fa-fw fa-table"></i>
          <span>Tables</span>
        </a>
      </li>

      <hr className="sidebar-divider d-none d-md-block" />

      {/* Toggle */}
      <div className="text-center d-none d-md-inline">
        <button
          className="rounded-circle border-0"
          onClick={() => setCollapsed(!collapsed)}
        ></button>
      </div>
    </ul>
  );
}
