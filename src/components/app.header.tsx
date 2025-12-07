'use client'
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import "@/styles/appheader.css"

function AppHeader() {
  const pathname = usePathname();

  return (
    <Navbar expand="lg" className="custom-navbar">
      <Container>
        <Navbar.Brand href="/" className="d-flex align-items-center gap-2 text-white fw-bold" >
          <Image 
            src="/milwaukee_logo.png" 
            width={120} 
            height={50} 
            alt="Milwaukee logo" 
          />
          IDM Data Team
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" className="custom-toggle" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">

            <Link 
              href="/Facebook" 
              className={`nav-link custom-link ${pathname === "/Facebook" ? "active-nav" : ""}`}
            >
              Facebook
            </Link>

            <Link 
              href="/Youtube" 
              className={`nav-link custom-link ${pathname === "/Youtube" ? "active-nav" : ""}`}
            >
              Youtube
            </Link>

            <Link 
              href="/Orgchart" 
              className={`nav-link custom-link ${pathname === "/Orgchart" ? "active-nav" : ""}`}
            >
              Orgchart
            </Link>

            <NavDropdown title="More" id="basic-nav-dropdown" className="custom-dropdown">
              <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
            </NavDropdown>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppHeader;
