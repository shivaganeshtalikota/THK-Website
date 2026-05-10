import { Routes, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import About from './pages/About'
import Political from './pages/Political'
import Community from './pages/Community'
import Media from './pages/Media'
import Contact from './pages/Contact'

function App() {
  return (
    <>
      <Helmet>
        <title>Hari Krishna Talikota - iTDP Telangana State President</title>
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/political" element={<Political />} />
            <Route path="/community" element={<Community />} />
            <Route path="/media" element={<Media />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </>
  )
}

export default App
